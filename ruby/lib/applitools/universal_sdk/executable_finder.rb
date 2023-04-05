# frozen_string_literal: true

module Applitools::Connectivity
  module UniversalServerGemFinder
    extend self

    SERVER_GEM_NAME = 'eyes_universal'

    def filepath
      server_lib ? File.join(server_lib.gem_dir, 'ext', 'eyes-universal', filename) : ''
    end

    def filepath2
      File.join(Gem.default_dir, 'gems', server_lib.full_name, 'ext', 'eyes-universal', filename)
    end

    def executable_filepath
      raise 'Universal server not Found' if server_lib.nil?
      puts "filepath1 : #{filepath}"
      return filepath if valid_file?(filepath)
      puts "Gem.default_dir : #{Gem.default_dir}"
      puts "server_lib.base_dir : #{server_lib.base_dir}"
      puts "filepath2 : #{filepath2}"
      return filepath2 if (Gem.default_dir != server_lib.base_dir) && valid_file?(filepath2) # build & unpublished
      raise 'Universal server unrecognized'
    end

    private

    def server_lib
      Gem::Specification.find_by_name(SERVER_GEM_NAME)
    rescue Gem::MissingSpecError
      nil
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
          raise 'Unsupported platform'
      end
    end

    def valid_file?(path)
      File.exist?(path) && File.executable?(path)
    end

  end
end
