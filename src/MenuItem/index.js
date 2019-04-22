import Popup from '../Popup';
import keyCodes from '../lib/keyCodes';
import instanceOf from '../lib/instanceOf';

/**
 * MenuItem class for managing menu items' keyboard interactions.
 *
 * @param {HTMLElement} list The list to manage.
 */
export default class MenuItem {
  /**
   * Test for a list as the next sibling element.
   *
   * @param {HTMLElement} element The element for which we're looking for a sibling.
   *
   * @return {HTMLElement|Boolean}
   */
  static nextElementIsUl(element) {
    const next = element.nextElementSibling;
    return (null !== next && 'UL' === next.nodeName) ? next : false;
  }

  /**
   * Start the component
   */
  constructor(list) {
    /**
     * The list to manage
     * @type {HTMLElement}
     */
    this.list = list;

    // Save a reference to the MenuItem instance on the list item.
    Object.assign(list, { menuItem: this });

    /**
     * The list's child elements.
     * @type {Array}
     */
    this.listItems = Array.prototype.slice.call(list.children);

    // Bind class methods
    this.handleListKeydown = this.handleListKeydown.bind(this);

    this.init();
  }

  /**
   * Return the class name for referencing and identifying instances.
   *
   * @return {String}
   */
  static getClassName() {
    return 'menuItem';
  }

  /**
   * Collect menu links and recursively instantiate sublist menu items.
   */
  init() {
    // Collect menu items.
    this.menuItems = this.listItems.reduce((acc, item) => {
      const itemLink = item.firstElementChild;

      if (null !== itemLink && 'A' === itemLink.nodeName) {
        return [...acc, itemLink];
      }

      return acc;
    }, []);

    /**
     * The number of menu items.
     * @type {Number}
     */
    this.menuItemsLength = this.menuItems.length;

    // Set menu item link attributes and event listeners.
    this.menuItems.forEach((link, index) => {
      link.setAttribute(
        'aria-describedby',
        // eslint-disable-next-line max-len
        'menu-class-submenu-explore menu-class-submenu-help menu-class-submenu-back menu-class-esc-help'
      );

      // Add size and position attributes.
      link.setAttribute('aria-setsize', this.menuItemsLength);
      link.setAttribute('aria-posinset', index + 1);

      link.addEventListener('keydown', this.handleListKeydown);

      const siblingList = this.constructor.nextElementIsUl(link);
      if (siblingList) {
        const subList = new MenuItem(siblingList);
        // Save the list's previous sibling.
        subList.previousSibling = link;
      }
    });

    // Save the menu's first item.
    const [firstItem] = this.menuItems;
    Object.assign(this, { firstItem });
  }

  /**
   * Handle keydown events on menu items.
   *
   * @param {Object} event The event object.
   */
  handleListKeydown(event) {
    const { keyCode } = event;
    const {
      UP,
      DOWN,
      LEFT,
      RIGHT,
    } = keyCodes;
    const { activeElement } = document;
    const activeDescendant = (this.list.contains(activeElement)
      ? activeElement
      : this.menuItems[0]);
    const menuLastIndex = this.menuItems.length - 1;
    const activeIndex = this.menuItems.indexOf(activeDescendant);

    if ([UP, DOWN].includes(keyCode)) {
      // Move through sibling list items.
      event.stopPropagation();
      event.preventDefault();

      // Determine the direction.
      let nextIndex = (keyCode === UP)
        ? activeIndex - 1
        : activeIndex + 1;

      // Move to the end if we're moving to the previous child from the first child.
      if (UP === keyCode && 0 > nextIndex) {
        nextIndex = menuLastIndex;
      }

      // Move to first child if we're at the end.
      if (DOWN === keyCode && menuLastIndex < nextIndex) {
        nextIndex = 0;
      }

      this.menuItems[nextIndex].focus();
    } else if (RIGHT === keyCode) {
      // Drill down into a nested list, if present.
      const siblingElement = this.constructor.nextElementIsUl(activeDescendant);

      if (siblingElement && instanceOf(siblingElement, MenuItem)) {
        event.stopPropagation();
        event.preventDefault();

        const { menuItem } = siblingElement;
        menuItem.firstItem.focus();
      }
    } else if (LEFT === keyCode) {
      // Move up to the list's previous sibling, if present.
      if (undefined !== this.previousSibling) {
        event.stopPropagation();
        event.preventDefault();
        // Close the popup if it exists and is exapnded.
        if (instanceOf(this.previousSibling, Popup)) {
          event.stopPropagation();
          event.preventDefault();

          const { popup } = this.previousSibling;
          if (popup.state.expanded) {
            popup.setExpandedState(false);
          }
        }

        this.previousSibling.focus();
      }
    }
  }
}