import type { DocumentEvent, DocumentEventSubscriber } from "./DocumentEvents.js";

/** Session lifecycle notifications used by stateful plugins such as tree labels. */
export class DocumentEventBus {
  private readonly subscribers: DocumentEventSubscriber[] = [];

  public subscribe(subscriber: DocumentEventSubscriber): () => void {
    this.subscribers.push(subscriber);
    return () => {
      const index = this.subscribers.indexOf(subscriber);
      if (index >= 0) {
        this.subscribers.splice(index, 1);
      }
    };
  }

  public emit(event: DocumentEvent): void {
    for (const subscriber of [...this.subscribers]) {
      subscriber.onDocumentEvent(event);
    }
  }
}
