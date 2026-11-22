// Stands in for assets/dialog.js.
export class DialogCloseEvent extends Event {
  static eventName = 'dialog:close';

  constructor() {
    super(DialogCloseEvent.eventName);
  }
}
