# frozen_string_literal: false

require 'applitools/core/eyes_base'

# Eyes Images SDK
#
module Applitools::Images
  # A class to perform visual validation on images. Allows to handle user data like +Mouse trigger+ and +Text trigger+
  # @example
  #   eyes = Applitools::Images::Eyes.new
  #   eyes.open(app_name: 'App name', test_name: 'Test name')
  #   eyes.check_image(eyes.check_image(image_path: '~/test/some_screenshot.png', tag: 'My Test')
  #   eyes.close(true)
  class Eyes < Applitools::EyesBase
    # @!visibility private
    attr_accessor :base_agent_id, :screenshot, :inferred_environment, :title

    # @!visibility private
    def capture_screenshot
      @screenshot
    end

    # Creates a new eyes object
    # @example
    #   eyes = Applitools::Images::Eyes.new
    # @param server_url The Eyes Server URL
    def initialize(server_url = Applitools::Connectivity::ServerConnector::DEFAULT_SERVER_URL)
      super
      self.base_agent_id = "eyes.images.ruby/#{Applitools::VERSION}".freeze
      self.runner = Applitools::ClassicRunner.new
    end

    # Starts a test.
    # @param [Hash] options
    # @option options [String] :app_name the name of the application under trest. Required.
    # @option options [String] :test_name the test name. Required
    # @option options [String | Hash] :viewport_size viewport size for the baseline, may be passed as a
    #   string (<tt>'800x600'</tt>) or as a hash (<tt>{width: 800, height: 600}</tt>).
    #   If ommited, the viewport size will be grabbed from the actual image size
    # @example
    #   eyes.open app_name: 'my app', test_name: 'my test'
    def open(options = {})
      Applitools::ArgumentGuard.hash options, 'open(options)', [:app_name, :test_name]
      options[:viewport_size] = Applitools::RectangleSize.from_any_argument options[:viewport_size]
      # options = Applitools::Utils.extract_options!(args)
      universal_open(options)
    end

    # Opens eyes using passed options, yields the block and then closes eyes session.
    # Use Applitools::Images::Eyes method inside the block to perform the test. If the block throws an exception,
    # eyes session will be closed correctly.
    # @example
    #  eyes.test(app_name: 'Eyes.Java', test_name: 'home2') do
    #    eyes.check_image(image_path: './images/viber-home.png')
    #    eyes.check_image(image_path: './images/viber-bada.png')
    #  end
    def test(options = {}, &_block)
      open(options)
      yield
      close
    ensure
      abort_if_not_closed
    end

    def check(*args)
      args.compact!
      case (first_arg = args.shift)
      when String
        name = first_arg
        target = args.shift
      when Applitools::Selenium::Target
        target = first_arg
      when Hash
        target = first_arg[:target]
        name = first_arg[:name] || first_arg[:tag]
      end

      check_it(name, target, Applitools::MatchWindowData.new(default_match_settings)).as_expected?
    end

    def check_single(name, target, options = {})
      open_and_close(name, target, options) do |n, t|
        check_it(n, t, Applitools::MatchSingleCheckData.new)
      end
    end

    def open_and_close(*args)
      options_for_open = Applitools::Utils.extract_options!(args)
      open(options_for_open)
      result = yield(*args)
      close(true, true)
      result
    end

    def check_it(name, target, match_window_data)
      Applitools::ArgumentGuard.not_nil(name, 'name')

      return universal_check(name, target)

      region_provider = get_region_provider(target)

      match_window_data.tag = name
      match_window_data.read_target(target, nil)

      image = target.image
      self.viewport_size = Applitools::RectangleSize.new image.width, image.height if viewport_size.nil?
      self.screenshot = EyesImagesScreenshot.new image

      if match_window_data.is_a? Applitools::MatchSingleCheckData
        return check_single_base(
          region_provider,
          target.options[:timeout] || Applitools::EyesBase::USE_DEFAULT_TIMEOUT,
          match_window_data
        )
      end

      check_window_base(
        region_provider,
        target.options[:timeout] || Applitools::EyesBase::USE_DEFAULT_TIMEOUT,
        match_window_data
      )
    end

    def get_region_provider(target)
      if (region_to_check = target.region_to_check).nil?
        Object.new.tap do |prov|
          prov.instance_eval do
            define_singleton_method :region do
              Applitools::Region::EMPTY
            end

            define_singleton_method :coordinate_type do
              nil
            end
          end
        end
      else
        Object.new.tap do |prov|
          prov.instance_eval do
            define_singleton_method :region do
              region_to_check
            end

            define_singleton_method :coordinate_type do
              Applitools::EyesScreenshot::COORDINATE_TYPES[:context_relative]
            end
          end
        end
      end
    end

    # Matches the input image with the next expected image. Takes a hash as an argument. Returns +boolean+
    # as result of matching.
    # @param [Hash] options
    # @option options [Applitools::Screenshot] :image
    # @option options [String] :image_bytes image in PNG format. Can be obtained as ChunkyPNG::Image.to_blob()
    # @option options [String] :image_path
    # @option options [String] :tag An optional tag to be associated with the validation checkpoint.
    # @option options [Boolean] :ignore_mismatch If set to +true+ the server should ignore a negative
    #   result for the visual validation. (+false+ by default)
    # @example Image is a file
    #   eyes.check_image(image_path: '~/test/some_screenshot.png', tag: 'My Test')
    # @example Image is a +Applitools::Screenshot+ instance
    #   eyes.check_image(image: my_image, tag: 'My Test')
    # @example Image is a +String+
    #   eyes.check_image(image_bytes: string_represents_image, tag: 'My Test')
    # @example Ignore mismatch
    #   eyes.check_image(image: my_image, tag: 'My Test', ignore_mismatch: true)
    def check_image(options)
      options = { tag: '', ignore_mismatch: false }.merge options
      # image = get_image_from_options(options)
      target = Applitools::Images::Target.any(options).ignore_mismatch(options[:ignore_mismatch])
      check(options[:tag], target)
    end

    # Performs visual validation for the current image.
    # @param [Hash] options
    # @option options [Applitools::Region] :region A region to validate within the image
    # @option options [Applitools::Screenshot] :image Image to validate
    # @option options [String] :image_bytes Image in +PNG+ format. Can be obtained as ChunkyPNG::Image.to_blob()
    # @option options [String] :image_path Path to image file
    # @option options [String] :tag An optional tag to be associated with the validation checkpoint.
    # @option options [Boolean] :ignore_mismatch If set to +true+ the server would ignore a negative
    #   result for the visual validation
    # @example Image is a file
    #   eyes.check_region(image_path: '~/test/some_screenshot.png', region: my_region, tag: 'My Test')
    # @example Image is a Applitools::Screenshot instance
    #   eyes.check_region(image: my_image, tag: 'My Test', region: my_region)
    # @example Image is a +String+
    #   eyes.check_region(image_bytes: string_represents_image, tag: 'My Test', region: my_region)
    def check_region(options)
      options = { tag: '', ignore_mismatch: false }.merge options
      Applitools::ArgumentGuard.not_nil options[:region], 'options[:region] can\'t be nil!'
      # image = get_image_from_options options
      target = Applitools::Images::Target.any(options).ignore_mismatch(options[:ignore_mismatch])
      target.region(options[:region])
      logger.info "check_region(image, #{options[:region]}, #{options[:tag]}, #{options[:ignore_mismatch]})"
      check(options[:tag], target)
    end

    # Adds a mouse trigger
    # @param [Symbol] action A mouse action. Can be one of  +:click+, +:right_click+, +:double_click+, +:move+,
    #   +:down+, +:up+
    # @param [Applitools::Region] control The control on which the trigger is activated
    #   (context relative coordinates).
    # @param [Applitools::Location] cursor The cursor's position relative to the control.
    def add_mouse_trigger(action, control, cursor)
      add_mouse_trigger_base action, control, cursor
    end

    # Adds a keyboard trigger
    # @param [Applitools::Region] control the control's context-relative region.
    # @param text The trigger's text.
    def add_text_trigger(control, text)
      add_text_trigger_base control, text
    end

    def get_app_output_with_screenshot(*_args)
      result = super
      self.screenshot_url = nil
      result
    end

    private

    def vp_size
      viewport_size
    end

    def vp_size=(value, skip_check_if_open = false)
      raise Applitools::EyesNotOpenException.new 'set_viewport_size: Eyes not open!' unless skip_check_if_open || open?
      Applitools::ArgumentGuard.not_nil 'value', value
      @viewport_size = Applitools::RectangleSize.for value
    end

    alias get_viewport_size vp_size
    alias set_viewport_size vp_size=

    # def get_image_from_options(options)
    #   image = if options[:image].nil? || !options[:image].is_a?(Applitools::Screenshot)
    #             # if options[:image].is_a? ChunkyPNG::Image
    #             #   Applitools::Screenshot.from_image options[:image]
    #             # if !options[:image_path].nil? && !options[:image_path].empty?
    #             #   Applitools::Screenshot.from_datastream ChunkyPNG::Datastream.from_file(options[:image_path]).to_s
    #             if !options[:image_bytes].nil? && !options[:image_bytes].empty?
    #               Applitools::Screenshot.from_datastream options[:image_bytes]
    #             end
    #           else
    #             options[:image]
    #           end
    #
    #   Applitools::ArgumentGuard.not_nil image, 'options[:image] can\'t be nil!'
    #
    #   image
    # end
  end
end
