# frozen_string_literal: true

require 'open-uri'
require 'digest'
require 'fileutils'

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

    end
  end
end
