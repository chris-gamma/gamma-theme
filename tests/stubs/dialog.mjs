// Stands in for assets/dialog.js.
export class DialogCloseEvent extends CustomEvent {
  static eventName = 'dialog:close';

  constructor() {
    super(DialogCloseEvent.eventName);
  }
}
