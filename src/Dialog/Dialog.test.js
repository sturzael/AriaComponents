import Dialog from '.';
import events from '../../utils/events';

const {
  click,
  keydownTab,
  keydownShiftTab,
  keydownEsc,
} = events;

// Set up our document body
document.body.innerHTML = `
  <main>
    <article>
      <h1>The Article Title</h1>
      <p>Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do
      eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad
      minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip
      ex ea commodo consequat. Duis aute irure dolor in reprehenderit in
      voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur
      sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt
      mollit anim id est laborum.</p>
      <a class="link" href="#dialog">Open dialog</a>
    </article>
  </main>
  <div class="wrapper" id="dialog">
    <button>Close</button>
    <ul>
      <li><a href="example.com"></a></li>
      <li><a href="example.com"></a></li>
      <li><a href="example.com"></a></li>
      <li><a class="last-item" href="example.com"></a></li>
    </ul>
  </div>
`;

const controller = document.querySelector('.link');
const target = document.getElementById('dialog');
const close = target.querySelector('button');
const content = document.querySelector('main');

// Cached elements.
const lastItem = document.querySelector('.last-item');

const modal = new Dialog({
  controller,
  target,
  close,
  content,
});

describe('Dialog with default configuration', () => {
  beforeEach(() => {
    modal.setState({ visible: false });
  });

  describe('Dialog adds and manipulates DOM element attributes', () => {
    it('Should be instantiated as expected', () => {
      expect(modal).toBeInstanceOf(Dialog);

      expect(controller.dialog).toBeInstanceOf(Dialog);
      expect(target.dialog).toBeInstanceOf(Dialog);

      expect(modal.getState().visible).toBeFalsy();
    });

    it('Should add the correct attributes and overlay element',
      () => {
        expect(controller.getAttribute('aria-haspopup')).toEqual('dialog');
        expect(controller.getAttribute('aria-expanded')).toEqual('false');
        expect(target.getAttribute('aria-hidden')).toEqual('true');
        expect(document.getElementById('aria-dialog-overlay')).not.toBeNull();
      });
  });

  describe('Dialog class methods', () => {
    it('Should reflect the accurate state', () => {
      modal.show();
      expect(modal.getState().visible).toBeTruthy();
      expect(document.activeElement).toEqual(close);

      modal.hide();
      expect(modal.getState().visible).toBeFalsy();
      expect(document.activeElement).toEqual(controller);
    });
  });

  describe('Dialog correctly responds to events', () => {
    beforeEach(() => {
      modal.setState({ visible: true });
    });

    it('Should update attributes when the controller is clicked', () => {
      // Click to close (it is opened by `beforeEach`)
      close.dispatchEvent(click);
      expect(modal.getState().visible).toBeFalsy();
      expect(controller.getAttribute('aria-expanded')).toEqual('false');
      expect(content.getAttribute('aria-hidden')).toEqual('false');
      expect(target.getAttribute('aria-hidden')).toEqual('true');

      // Click to re-open.
      controller.dispatchEvent(click);
      expect(modal.getState().visible).toBeTruthy();
      expect(controller.getAttribute('aria-expanded')).toEqual('true');
      expect(content.getAttribute('aria-hidden')).toEqual('true');
      expect(target.getAttribute('aria-hidden')).toEqual('false');
    });

    it('Should trap keyboard tabs within the modal', () => {
      close.dispatchEvent(keydownShiftTab);
      expect(document.activeElement).toEqual(lastItem);

      lastItem.dispatchEvent(keydownTab);
      expect(document.activeElement).toEqual(close);
    });

    it('Should close when the ESC key is pressed', () => {
      lastItem.focus();
      lastItem.dispatchEvent(keydownEsc);
      expect(modal.getState().visible).toBeFalsy();
    });

    it('Should close on outside click', () => {
      modal.overlay.dispatchEvent(click);
      expect(modal.getState().visible).toBeFalsy();
    });
  });
});