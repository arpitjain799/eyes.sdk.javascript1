# frozen_string_literal: true

# coding: utf-8
lib = File.expand_path('../lib', __FILE__)
$LOAD_PATH.unshift(lib) unless $LOAD_PATH.include?(lib)
require 'applitools/version'

module_files = `git ls-files lib/applitools/images`.split($RS) + `git ls-files lib/applitools/selenium`.split($RS) +
  ['lib/eyes_images', 'lib/applitools/capybara', 'lib/eyes_selenium'] +
  ['lib/applitools/universal_sdk/universal_server_downloader.rb']

Gem::Specification.new do |spec|
  spec.name          = 'eyes_core'
  spec.version       = Applitools::VERSION
  spec.authors       = ['Applitools Team']
  spec.email         = ['team@applitools.com']
  spec.description   = "Don't use it directly, take a look at eyes_selenium, eyes_images or eyes_calabash gems instead."
  spec.summary       = 'Core of the Applitools Ruby SDK'
  spec.homepage      = 'https://www.applitools.com'
  spec.license       = 'Applitools'

  spec.files         = `git ls-files lib/applitools`.split($RS) + `git ls-files ext/eyes_core`.split($RS) +
    ['lib/require_utils.rb', 'lib/eyes_core.rb', 'lib/eyes_rspec.rb', 'lib/eyes_consts.rb'] - module_files
  spec.executables   = spec.files.grep(%r{^bin/}) { |f| File.basename(f) }
  spec.test_files    = spec.files.grep(%r{^(test|spec|features)/})

  spec.extensions    = ['ext/eyes_core/extconf.rb']
  spec.require_paths = %w(lib ext)

  spec.metadata['yard.run'] = 'yri' # use "yard" to build full HTML docs.

  # spec.add_dependency 'oily_png', '~> 1.2'
  # spec.add_dependency 'chunky_png', '= 1.3.6'
  spec.add_dependency 'faraday'
  spec.add_dependency 'faraday_middleware'
  spec.add_dependency 'faraday-cookie_jar'

  spec.add_dependency 'oj'
  spec.add_dependency 'colorize'
  spec.add_dependency 'websocket'
  spec.add_dependency 'sorted_set'
  spec.add_dependency 'eyes_universal', "~> #{Applitools::UNIVERSAL_VERSION}"

  spec.add_development_dependency 'bundler'
  spec.add_development_dependency 'rake'
  spec.add_development_dependency 'rspec', '>= 3'
  spec.add_development_dependency 'rubocop', '<= 0.46.0'
  spec.add_development_dependency 'webdrivers'

  # Exclude debugging support on Travis CI, due to its incompatibility with jruby and older rubies.
  unless ENV['TRAVIS']
    spec.add_development_dependency 'pry'
    spec.add_development_dependency 'pry-byebug'
    spec.add_development_dependency 'byebug'
    spec.add_development_dependency 'pry-doc'
    spec.add_development_dependency 'pry-stack_explorer'
    spec.add_development_dependency 'rb-readline'
  end
end
