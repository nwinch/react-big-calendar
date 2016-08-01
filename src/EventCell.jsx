import React from 'react';
import cn from 'classnames';
import dates from './utils/dates';
import { accessor as get } from './utils/accessors';

let EventCell = React.createClass({
  render() {
    let {
        className, event, selected, eventPropGetter
      , startAccessor, endAccessor, titleAccessor
      , slotStart, slotEnd, onSelect, component, ...props } = this.props;

    let Component = component;

    let title = get(event, titleAccessor)
      , end = get(event, endAccessor)
      , start = get(event, startAccessor)
      , isAllDay = get(event, props.allDayAccessor)
      , continuesPrior = dates.lt(start, slotStart, 'day')
      , continuesAfter = dates.gt(end, slotEnd, 'day')

    if (eventPropGetter)
      var { style, className: xClassName } = eventPropGetter(event, start, end, selected);

    return (
      <a
        {...props}
        style={{...props.style, ...style}}
        className={cn('rbc-event', className, xClassName, {
          'rbc-selected': selected,
          'rbc-event-allday': isAllDay || dates.diff(start, dates.ceil(end, 'day'), 'day') > 1,
          'rbc-event-continues-prior': continuesPrior,
          'rbc-event-continues-after': continuesAfter
        })}
        onClick={e => e.preventDefault()}
        onTouchTap={(e) => {
          const ev = Object.assign({}, e);
          console.log('touched original', e);
          console.log(ev.preventDefault(), ev.stopPropagation());
          console.log('touched', ev);

          e.preventDefault();
          e.stopPropagation();

          // return onSelect(event);
        }}
      >
        <div className='rbc-event-content' title={title}>
          { Component
            ? <Component event={event} title={title}/>
            : title
          }
        </div>
      </a>
    );
  }
});

export default EventCell
