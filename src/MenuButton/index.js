import AriaComponent from '../AriaComponent';
import Popup from '../Popup';
import Menu from '../Menu';
import keyCodes from '../lib/keyCodes';

/**
 * Class to set up an interactive Menu Button element.
 *
 * https://www.w3.org/TR/wai-aria-practices-1.1/#menubutton
 * https://www.w3.org/TR/wai-aria-practices-1.1/examples/menu-button/menu-button-links.html
 */
export default class MenuButton extends AriaComponent {
  /**
   * Create a ListBox.
   * @constructor
   *
   * @param {object} config The config object.
   */
  constructor(config) {
    super(config);

    /**
     * The component name.
     *
     * @type {string}
     */
    this.componentName = 'menuButton';

    /**
     * Options shape.
     *
     * @type {object}
     */
    const options = {
      /**
       * The element used to trigger the Menu Popup.
       *
       * @type {HTMLElement}
       */
      controller: null,

      /**
       * The Menu wrapper element.
       *
       * @type {HTMLElement}
       */
      target: null,

      /**
       * The Menu element.
       *
       * @type {HTMLElement}
       */
      menu: null,

      /**
       * Callback to run after the component initializes.
       * @callback initCallback
       */
      onInit: () => {},

      /**
       * Callback to run after component state is updated.
       * @callback stateChangeCallback
       */
      onStateChange: () => {},

      /**
       * Callback to run after the component is destroyed.
       * @callback destroyCallback
       */
      onDestroy: () => {},
    };

    // Merge config options with defaults.
    Object.assign(this, options, config);

    // Bind class methods.
    this.handleControllerKeydown = this.handleControllerKeydown.bind(this);
    this.show = this.show.bind(this);
    this.hide = this.hide.bind(this);
    this.destroy = this.destroy.bind(this);

    // Only initialize if we passed in controller and target elements.
    if (null !== this.controller && null !== this.target) {
      this.init();
    }
  }

  /**
   * Set up the component's DOM attributes and event listeners.
   */
  init() {
    /**
     * The MenuButton is basically a Popup to present a Menu, so we instantiate
     * a Popup and subscribe to state changes to act on the MenuButton when the
     * Popup is shown and hidden.
     *
     * @type {Popup}
     */
    this.popup = new Popup({
      controller: this.controller,
      target: this.target,
      type: 'menu',
      onStateChange: this.onStateChange,
    });

    // Initialize the Menu if we passed one in.
    if (null !== this.menu && 'UL' === this.menu.nodeName) {
      this.menu = new Menu({ menu: this.menu });
    } else if ('UL' === this.target.nodeName) {
      // Fallback to the target if it's a UL.
      this.menu = new Menu({ menu: this.target });
    }

    // Additional event listener(s).
    this.controller.addEventListener('keydown', this.handleControllerKeydown);

    // Run {initCallback}
    this.onInit.call(this);
  }

  // @todo Track Popup state like the Listbox does.
  /**
   * Manage MenuButton state.
   *
   * @param {Object} state The component state.
   */
  // stateWasUpdated({ expanded }) {
  // }

  /**
   * Handle keydown events on the MenuButton controller.
   *
   * @param {Event} event The event object.
   */
  handleControllerKeydown(event) {
    const { keyCode } = event;
    const {
      RETURN,
      UP,
      DOWN,
      SPACE,
    } = keyCodes;

    switch (keyCode) {
      /*
       * Open the menu and move focus to the first menu item.
       */
      case RETURN:
      case SPACE:
      case DOWN: {
        event.preventDefault();
        this.show();

        // Move focus to the first menu item.
        if (this.menu.firstItem) {
          this.menu.firstItem.focus();
        }

        break;
      }

      /*
       * Opens the menu and move focus to the last menu item.
       */
      case UP: {
        event.preventDefault();
        this.show();

        // Move focus to the last menu item.
        if (this.menu.lastItem) {
          this.menu.lastItem.focus();
        }

        break;
      }

      default:
        break;
    }
  }

  /**
   * Destroy the Popup and Menu.
   */
  destroy() {
    // Destroy the MenuButton Popup.
    this.popup.destroy();

    // Destroy the Menu.
    this.menu.destroy();

    // Run {destroyCallback}
    this.onDestroy.call(this);
  }

  /**
   * Show the MenuButton.
   */
  show() {
    this.popup.show();
  }

  /**
   * Hide the MenuButton.
   */
  hide() {
    this.popup.hide();
  }
}