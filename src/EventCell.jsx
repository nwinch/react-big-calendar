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
      <div
        {...props}
        style={{...props.style, ...style}}
        className={cn('rbc-event', className, xClassName, {
          'rbc-selected': selected,
          'rbc-event-allday': isAllDay || dates.diff(start, dates.ceil(end, 'day'), 'day') > 1,
          'rbc-event-continues-prior': continuesPrior,
          'rbc-event-continues-after': continuesAfter
        })}
      >
        <a
          className='rbc-event-content'
          onClick={e => {
            console.log('a clicked', e);
            e.preventDefault();
            e.stopPropagation();
          }}
          onTouchTap={e => {
            const ev = Object.assign({}, e);
            console.log('touched original', e);
            console.log('e.preventDefault()', e.preventDefault());
            console.log('e.stopPropagation()', e.stopPropagation());
            console.log('touched', ev);
            e.preventDefault();
            e.stopPropagation();

            return onSelect(event);
          }}
          title={title}
        >
          { Component
            ? <Component event={event} title={title}/>
            : title
          }
        </a>
      </div>
    );
  }
});

export default EventCell
