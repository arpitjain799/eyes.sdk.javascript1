# frozen_string_literal: true

require 'open-uri'
require 'digest'
require 'fileutils'
require 'rubygems/package'
require 'zlib'

module Applitools
  class UniversalServerDownloader
    class << self

      def download(to)
        puts "[eyes-universal] Downloading Eyes universal server from #{full_url}"
        where = filepath(to)
        full_url.open {|cloud| File.binwrite(where, cloud.read) }
        if Digest::SHA256.file(where).to_s == expected_binary_sha
          FileUtils.chmod('+x', where)
          puts "[eyes-universal] Download complete. Server placed in #{where}"
        else
          puts "[eyes-universal] Download broken. Please try reinstall"
        end
      end

      def filepath(to)
        File.expand_path(filename, to)
      end

      def tar_gz_filepath(to)
        File.expand_path(tar_gz_filename, to)
      end

      def tar_gz_download(to) # build
        puts "[eyes-universal] Downloading Core server from #{tar_gz_full_url}"
        where = tar_gz_filepath(to)
        tar_gz_full_url.open {|cloud| File.binwrite(where, cloud.read) }
        downloaded_sha = Digest::SHA256.file(where).to_s
        if downloaded_sha == tar_gz_sha
          Gem::Package::TarReader.new(Zlib::GzipReader.open(where)) do |tar|
            tar.each do |entry|
              binary_filename = File.basename(entry.full_name)
              dest = File.expand_path(binary_filename, to)
              dest_dir = File.dirname(dest)
              FileUtils.mkdir_p(dest_dir) unless Dir.exist?(dest_dir)
              FileUtils.remove_file(dest) if File.exist?(dest)
              File.open(dest, 'wb') {|f| f.print entry.read }

              binary_sha = Digest::SHA256.file(dest).to_s
              if check_binary(binary_filename, binary_sha)
                FileUtils.chmod('+x', dest)
                puts "[eyes-universal] Binary check pass #{binary_filename} (#{Applitools::UNIVERSAL_CORE_VERSION}): #{dest}"
                FileUtils.rm(dest)
              else
                raise "[eyes-universal] Binary fail #{binary_filename} (#{Applitools::UNIVERSAL_CORE_VERSION}): #{binary_sha}"
              end
            end
          end
          puts "[eyes-universal] Download complete (#{Applitools::UNIVERSAL_CORE_VERSION}). Server placed in #{where}"
        else
          raise "[eyes-universal] Download broken. (mismatch: #{downloaded_sha})"
        end
      end

      def prepare_server(to) # install
        where = tar_gz_filepath(to)
        downloaded_sha = Digest::SHA256.file(where).to_s
        puts "[eyes-universal] prepare server : #{where} #{downloaded_sha}"

        if downloaded_sha == tar_gz_sha
          Gem::Package::TarReader.new(Zlib::GzipReader.open(where)) do |tar|
            tar.each do |entry|
              binary_filename = File.basename(entry.full_name)
              if filename != binary_filename
                puts "[eyes-universal] skip #{binary_filename}"
                next
              end
              puts "[eyes-universal] process #{binary_filename}"
              unpacked_binary = File.expand_path(binary_filename, to)
              # FileUtils.remove_file(unpacked_binary) if File.exist?(unpacked_binary)
              File.open(unpacked_binary, 'wb') {|f| f.print entry.read }

              binary_sha = Digest::SHA256.file(unpacked_binary).to_s
              if check_binary(binary_filename, binary_sha)
                FileUtils.chmod('+x', unpacked_binary)
                puts "[eyes-universal] Binary ready #{binary_filename} (#{Applitools::UNIVERSAL_CORE_VERSION}) at #{unpacked_binary}"
              else
                puts "[eyes-universal] Binary check fail #{binary_filename} (#{Applitools::UNIVERSAL_CORE_VERSION}): #{binary_sha}"
              end
            end
          end
        else
          puts "[eyes-universal] Server broken. (mismatch: #{downloaded_sha})"
        end
      end

      private

      def base_url
        "https://github.com/applitools/eyes.sdk.javascript1/releases/download/%40applitools/core%40#{Applitools::UNIVERSAL_CORE_VERSION}/"
      end

      def full_url
        URI.join(base_url, filename)
      end

      def expected_binary_sha
        return '9f790b0731e620ddf39f80a7193585ecb99058a86a0eab89de70b5dc34dbcc7b' if Gem.win_platform?
        case RUBY_PLATFORM
          when /darwin/i
            '5489be902fdc79b2d5c271c5c4a639db829a3f652280ab979759ff4a2d3675a4'
          when /arm/i
            '217cd833752547b4fe74e178e8526a87f4020974a4719bf032a0d818587e8651'
          when /mswin|windows|mingw/i
            '9f790b0731e620ddf39f80a7193585ecb99058a86a0eab89de70b5dc34dbcc7b'
          when /musl/i
            '5408a87369445f0d9a571e55b8e86755710ce59d1f3fac0df7bdcbc5243b11c8'
          when /linux|arch/i
            '7fa0b5ad01e7ac55e0574f40d80400404540f00f5ea92a852bd48299f600b787'
          else
            raise 'Unsupported platform'
        end
      end

      def filename
        return 'core-win.exe' if Gem.win_platform?
        case RUBY_PLATFORM
          when /darwin/i
            'core-macos'
          when /arm/i
            'core-linux-arm64'
          when /mswin|windows|mingw/i
            'core-win.exe'
          when /musl/i
            'core-alpine'
          when /linux|arch/i
            'core-linux'
          else
            raise "Unsupported platform #{RUBY_PLATFORM}"
        end
      end

      def tar_gz_full_url
        URI.join(base_url, tar_gz_filename)
      end

      def tar_gz_filename
        'core.tar.gz'
      end
      def tar_gz_sha
        'b2c180b52eced0e5253dc03c527a42f944afb68a27b7f77b80b51dc4192a4d06'
      end

      def check_binary(binary_filename, binary_sha)
        expected_sha = case binary_filename
                       when 'core-alpine'
                         '5408a87369445f0d9a571e55b8e86755710ce59d1f3fac0df7bdcbc5243b11c8'
                       when 'core-linux'
                         '7fa0b5ad01e7ac55e0574f40d80400404540f00f5ea92a852bd48299f600b787'
                       when 'core-linux-arm64'
                         '217cd833752547b4fe74e178e8526a87f4020974a4719bf032a0d818587e8651'
                       when 'core-macos'
                         '5489be902fdc79b2d5c271c5c4a639db829a3f652280ab979759ff4a2d3675a4'
                       when 'core-win.exe'
                         '9f790b0731e620ddf39f80a7193585ecb99058a86a0eab89de70b5dc34dbcc7b'
                       else
                         raise "Unsupported platform #{binary_filename}"
                       end
        binary_sha == expected_sha
      end

    end
  end
end
