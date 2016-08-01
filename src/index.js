import Calendar from './Calendar';
import { set as setLocalizer } from './localizer';
import momentLocalizer from './localizers/moment';
import globalizeLocalizer from './localizers/globalize';
import viewLabel from './utils/viewLabel';
import move from './utils/move';
import { views } from './utils/constants';

require('react-tap-event-plugin')({
  shouldRejectClick: (lastTouchEventTimestamp, clickEventTimestamp) => {
    console.log(lastTouchEventTimestamp, clickEventTimestamp, clickEventTimestamp - lastTouchEventTimestamp);
    return true;
  }
});


Object.assign(Calendar, {
  setLocalizer,
  globalizeLocalizer,
  momentLocalizer,
  label: viewLabel,
  views,
  move
})

export default Calendar
