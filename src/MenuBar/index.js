import AriaComponent from '../AriaComponent';
import Popup from '../Popup';
import Menu from '../Menu';
import keyCodes from '../lib/keyCodes';
import { rovingTabIndex, tabIndexAllow } from '../lib/rovingTabIndex';
import { nextPreviousFromLeftRight } from '../lib/nextPrevious';
import isInstanceOf from '../lib/isInstanceOf';
import { missingDescribedByWarning } from '../lib/ariaDescribedbyElementsFound';

/**
 * Class for managing a visually persistent (horizontally-oriented) menubar,
 * with each submenu item is instantiated as a Popup.
 *
 * https://www.w3.org/TR/wai-aria-practices-1.1/#menu
 * https://www.w3.org/TR/wai-aria-1.1/#menubar
 */
export default class MenuBar extends AriaComponent {
  /**
   * Save the menuBar item's popup, if it exists.
   *
   * @param {HTMLElement} menubarItem The current menubarItem from state.
   * @return {Popup|Boolean} The menubarItem's popup, or false if none.
   */
  static getPopupFromMenubarItem(menubarItem) {
    return isInstanceOf(menubarItem.popup, Popup)
      ? menubarItem.popup
      : false;
  }

  /**
   * HTML IDs for elements containing help text
   *
   * @return {array}
   */
  static getHelpIds() {
    return [
      '#ac-describe-top-level-help',
      '#ac-describe-submenu-help',
      '#ac-describe-esc-help',
    ];
  }

  /**
   * Create a MenuBar.
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
    this.componentName = 'menuBar';

    /**
     * Options shape.
     *
     * @type {object}
     */
    const options = {
      /**
       * The menubar element.
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

      /**
       * Callback to run after Popup initializes.
       * @callback popupInitCallback
       */
      onPopupInit: () => {},

      /**
       * Callback to run after Popup state is updated.
       * @callback popupStateChangeCallback
       */
      onPopupStateChange: () => {},

      /**
       * Callback to run after Popup is destroyed.
       * @callback popupDestroyCallback
       */
      onPopupDestroy: () => {},
    };

    // Merge config options with defaults.
    Object.assign(this, options, config);

    // Bind class methods.
    this.handleMenuBarKeydown = this.handleMenuBarKeydown.bind(this);
    this.handleMenuBarClick = this.handleMenuBarClick.bind(this);
    this.stateWasUpdated = this.stateWasUpdated.bind(this);
    this.destroy = this.destroy.bind(this);

    // Only initialize if we passed in a <ul>.
    if (null !== this.menu && 'UL' === this.menu.nodeName) {
      this.init();
    }
  }

  /**
   * Collect top-level menu items and set up event handlers.
   */
  init() {
    /*
     * Add a reference to the class instance to enable external interactions
     * with this instance.
     */
    super.setSelfReference([this.menu]);

    // Set the menu role.
    this.menu.setAttribute('role', 'menubar');

    /**
     * The menubar's child elements.
     *
     * @type {array}
     */
    this.menuBarChildren = Array.prototype.slice.call(this.menu.children);

    /**
     * Collected menubar links.
     *
     * @type {array}
     */
    this.menuBarItems = this.menuBarChildren.reduce((acc, item) => {
      const itemLink = item.firstElementChild;

      if (null !== itemLink && 'A' === itemLink.nodeName) {
        return [...acc, itemLink];
      }

      return acc;
    }, []);

    /**
     * The number of menubar items.
     *
     * @type {number}
     */
    this.menuLength = this.menuBarItems.length;

    /*
     * Warn if aria-decribedby elements are not found.
     * Without these elements, the references will be broken and potentially
     * confusing to users.
     */
    missingDescribedByWarning(Menu.getHelpIds());

    /*
     * Set menubar item attributes.
     */
    this.menuBarChildren.forEach((item, index) => {
      // Add size and position attributes.
      item.setAttribute('aria-setsize', this.menuLength);
      item.setAttribute('aria-posinset', index + 1);
      item.setAttribute('role', 'menuitem');

      item.addEventListener('keydown', this.handleMenuBarKeydown);
    });

    /*
     * Set menubar link attributes.
     */
    this.menuBarItems.forEach((link) => {
      // Add a reference to the help text.
      link.setAttribute(
        'aria-describedby',
        // eslint-disable-next-line max-len
        'ac-describe-top-level-help ac-describe-submenu-help ac-describe-esc-help'
      );

      link.addEventListener('click', this.handleMenuBarClick);
    });

    /**
     * The index of the last menubar item
     *
     * @type {number}
     */
    this.lastIndex = (this.menuLength - 1);

    // Initialize popups for nested lists.
    this.popups = this.menuBarItems.reduce((acc, controller) => {
      const target = controller.nextElementSibling;

      if (null !== target && 'UL' === target.nodeName) {
        const popup = new Popup({
          controller,
          target,
          onStateChange: this.onPopupStateChange,
          onInit: this.onPopupInit,
          onDestroy: this.onPopupDestroy,
          type: 'menu',
        });

        const subList = new Menu({ menu: target });
        // Save the list's previous sibling.
        subList.previousSibling = controller;

        return [...acc, popup];
      }

      return acc;
    }, []);

    /**
     * Set initial state.
     *
     * @type {object}
     */
    const [menubarItem] = this.menuBarItems;
    this.state = {
      menubarItem,
      popup: this.constructor.getPopupFromMenubarItem(menubarItem),
    };

    // Set up initial tabindex.
    rovingTabIndex(this.menuBarItems, menubarItem);

    // Run {initCallback}
    this.onInit.call(this);
  }

  /**
   * Manage menubar state.
   *
   * @param {Object} state The component state.
   */
  stateWasUpdated({ menubarItem }) {
    const popup = this.constructor.getPopupFromMenubarItem(menubarItem);

    // Add the current popup (or false) to state.
    Object.assign(this.state, { popup });

    rovingTabIndex(this.menuBarItems, menubarItem);

    menubarItem.focus();

    // Run {stateChangeCallback}
    this.onStateChange.call(this, this.state);
  }

  /**
   * Handle keydown events on the menuList element.
   *
   * @param {Object} event The event object.
   */
  handleMenuBarKeydown(event) {
    const {
      LEFT,
      RIGHT,
      DOWN,
      HOME,
      END,
      SPACE,
      RETURN,
    } = keyCodes;
    const { keyCode } = event;
    const { menubarItem, popup } = this.state;

    switch (keyCode) {
      /*
       * Move through sibling list items.
       */
      case LEFT:
      case RIGHT: {
        const nextItem = nextPreviousFromLeftRight(
          keyCode,
          menubarItem,
          this.menuBarItems
        );

        if (nextItem) {
          event.stopPropagation();
          event.preventDefault();

          // Close the popup.
          if (popup) {
            popup.setState({ expanded: false });
          }

          this.setState({
            menubarItem: nextItem,
          });
        }

        break;
      }

      /*
       * Open the popup if it exists and is not expanded.
       */
      case SPACE:
      case RETURN:
      case DOWN: {
        if (popup) {
          event.stopPropagation();
          event.preventDefault();

          if (! popup.state.expanded) {
            popup.setState({ expanded: true });
          }

          popup.firstChild.focus();
        }

        break;
      }

      /*
       * Select the first MenuBar item.
       */
      case HOME: {
        event.preventDefault();
        const [firstItem] = this.menuBarItems;
        this.setState({
          menubarItem: firstItem,
        });

        break;
      }

      /*
       * Select the last MenuBar item.
       */
      case END: {
        event.preventDefault();
        this.setState({
          menubarItem: this.menuBarItems[this.lastIndex],
        });

        break;
      }

      /*
       * Select the MenuBar item based on a search string created by
       * collecting key presses.
       */
      default: {
        const itemToFocus = this.typeAhead(keyCode, this.menuBarItems);
        if (null !== itemToFocus) {
          this.setState({ menubarItem: itemToFocus });
        }

        break;
      }
    }
  }

  /**
   * Update the active descendant when the item is clicked.
   *
   * @param {Object} event The event object.
   */
  handleMenuBarClick(event) {
    this.setState({
      menubarItem: event.target,
    });
  }

  /**
   * Recursively destroy MenuBar and Popups.
   */
  destroy() {
    delete this.menu.menuBar;

    // Remove the menu role.
    this.menu.removeAttribute('role');

    this.menuBarItems.forEach((link) => {
      // Remove reference to the help text.
      link.removeAttribute('aria-describedby');

      // Remove size and position attributes.
      link.parentElement.removeAttribute('aria-setsize');
      link.parentElement.removeAttribute('aria-posinset');

      // Remove event listeners.
      link.parentElement.removeEventListener(
        'keydown',
        this.handleMenuBarKeydown
      );
      link.removeEventListener('click', this.handleMenuBarClick);
    });

    // Destroy nested components.
    this.popups.forEach((popup) => {
      if (isInstanceOf(popup.target.menu, Menu)) {
        popup.target.menu.destroy();
      }
      popup.destroy();
    });

    // Revert tabindex attributes.
    tabIndexAllow(this.menuBarItems);

    // Run {destroyCallback}
    this.onDestroy.call(this);
  }
}
