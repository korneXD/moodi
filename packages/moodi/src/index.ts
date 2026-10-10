import { defineMoodi, MoodiBuddyElement } from './element';
import type { MoodChangeDetail } from './core/constants';

export * from './core/constants';
export { defineMoodi, MoodiBuddyElement };

declare global {
  interface HTMLElementTagNameMap {
    'moodi-buddy': MoodiBuddyElement;
  }
  interface HTMLElementEventMap {
    moodchange: CustomEvent<MoodChangeDetail>;
  }
}

defineMoodi();
