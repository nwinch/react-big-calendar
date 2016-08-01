import contains from 'dom-helpers/query/contains';
import events from 'dom-helpers/events';

function addEventListener(type, handler) {
  events.on(document, type, handler)
  return {
    remove(){ events.off(document, type, handler) }
  }
}

function isOverContainer(container, x, y){
  return !container || contains(container, document.elementFromPoint(x, y))
}

const clickTolerance = 5;

class Selection {

  constructor(node, global = false){
    this.container = node;
    this.globalMouse = !node || global;

    this._listeners = Object.create(null);

    this._touchStart = this._touchStart.bind(this)
    this._touchEnd = this._touchEnd.bind(this)
    this._mouseDown = this._mouseDown.bind(this)
    this._mouseUp = this._mouseUp.bind(this)
    this._openSelector = this._openSelector.bind(this)
    this._keyListener = this._keyListener.bind(this)

    this._onTouchStartListener = addEventListener('touchstart', this._touchStart)
    this._onMouseDownListener = addEventListener('mousedown', this._mouseDown)
    this._onKeyDownListener = addEventListener('keydown', this._keyListener)
    this._onKeyUpListener = addEventListener('keyup', this._keyListener)
  }

  on(type, handler) {
    let handlers = this._listeners[type] || (this._listeners[type] = []);

    handlers.push(handler);

    return {
      remove(){
        let idx = handlers.indexOf(handler);
        if( idx !== -1) handlers.splice(idx, 1)
      }
    }
  }

  emit(type, ...args){
    let handlers = this._listeners[type] || [];
    handlers.forEach(fn => fn(...args))
  }

  teardown() {
    this.listeners = Object.create(null)
    this._onTouchStartListener && this._onTouchStartListener.remove()
    this._onTouchEndListener && this._onTouchEndListener.remove()
    this._onMouseDownListener && this._onMouseDownListener.remove()
    this._onMouseUpListener && this._onMouseUpListener.remove();
    this._onMouseMoveListener && this._onMouseMoveListener.remove();
    this._onKeyUpListener && this._onKeyUpListener.remove();
    this._onKeyDownListener && this._onKeyDownListener.remove()
  }

  isSelected(node){
    let box = this._selectRect;

    if (!box || !this.selecting) return false;

    return objectsCollide(box, getBoundsForNode(node))
  }

  filter(items) {
    let box = this._selectRect;

    //not selecting
    if (!box || !this.selecting)
      return [];

    return items.filter(this.isSelected, this)
  }

  _mouseDown (e) {
    var node = this.container()
      , collides, offsetData;

    // Right clicks
    if (e.which === 3 || e.button === 2 || !isOverContainer(node, e.clientX, e.clientY))
      return;

    if (!this.globalMouse && node && !contains(node, e.target)) {

      let { top, left, bottom, right } = normalizeDistance(0);

      offsetData = getBoundsForNode(node);

      collides = objectsCollide({
        top: offsetData.top - top,
        left: offsetData.left - left,
        bottom: offsetData.bottom + bottom,
        right: offsetData.right + right
      },
      { top: e.pageY, left: e.pageX });

      if (!collides) return;
    }

    this.emit('mousedown', this._mouseDownData = {
      x: e.pageX,
      y: e.pageY,
      clientX: e.clientX,
      clientY: e.clientY
    });

    e.preventDefault();

    this._onMouseUpListener = addEventListener('mouseup', this._mouseUp)
    this._onMouseMoveListener = addEventListener('mousemove', this._openSelector)
  }

  _mouseUp(e) {

    this._onMouseUpListener && this._onMouseUpListener.remove();
    this._onMouseMoveListener && this._onMouseMoveListener.remove();

    if (!this._mouseDownData) return;

    var inRoot = !this.container || contains(this.container(), e.target);
    var bounds = this._selectRect;
    var click = this.isSelect(e.pageX, e.pageY, this._mouseDownData);

    this._mouseDownData = null

    if(click && !inRoot) {
      return this.emit('reset')
    }

    if(click && inRoot)
      return this.emit('click', { x: e.pageX, y: e.pageY })

    // User drag-clicked in the Selectable area
    if(!click)
      return this.emit('select', bounds)

    this.selecting = false;
  }

  _touchStart (e) {
    var node = this.container()
      , collides, offsetData;

    if (!this.globalMouse && node && !contains(node, e.target)) {

      let { top, left, bottom, right } = normalizeDistance(0);

      offsetData = getBoundsForNode(node);

      collides = objectsCollide({
        top: offsetData.top - top,
        left: offsetData.left - left,
        bottom: offsetData.bottom + bottom,
        right: offsetData.right + right
      },
      { top: e.changedTouches[0].pageY, left: e.changedTouches[0].pageX });

      if (!collides) return;
    }

    this.emit('touchstart', this._touchStartData = {
      x: e.changedTouches[0].pageX,
      y: e.changedTouches[0].pageY,
      clientX: e.changedTouches[0].clientX,
      clientY: e.changedTouches[0].clientY
    });

    e.preventDefault();

    this._onTouchEndListener = addEventListener('touchend', this._touchEnd)
  }

  _touchEnd(e) {

    this._onTouchEndListener && this._onTouchEndListener.remove();

    if (!this._touchStartData) return;

    var inRoot = !this.container || contains(this.container(), e.target);
    var click = this.isSelect(e.changedTouches[0].pageX, e.changedTouches[0].pageY, this._touchStartData);

    this._touchStartData = null

    if(click && !inRoot) {
      return this.emit('reset')
    }

    if(click && inRoot)
      return this.emit('click', { x: e.changedTouches[0].pageX, y: e.changedTouches[0].pageY }, e)

    this.selecting = false;
  }

  _openSelector(e) {
    var { x, y } = this._mouseDownData;
    var w = Math.abs(x - e.pageX);
    var h = Math.abs(y - e.pageY);

    let left = Math.min(e.pageX, x)
      , top = Math.min(e.pageY, y)
      , old = this.selecting;

    this.selecting = true;

    if (!old) {
      this.emit('selectStart', this._mouseDownData)
    }

    if (!this.isSelect(e.pageX, e.pageY, this._mouseDownData))
      this.emit('selecting', this._selectRect = {
        top,
        left,
        x: e.pageX,
        y: e.pageY,
        right: left + w,
        bottom: top + h
      });
  }

  _keyListener(e) {
    this.ctrl = (e.metaKey || e.ctrlKey)
  }

  isSelect(pageX, pageY, { x, y }) {
    return (
      Math.abs(pageX - x) <= clickTolerance &&
      Math.abs(pageY - y) <= clickTolerance
    );
  }
}

/**
 * Resolve the disance prop from either an Int or an Object
 * @return {Object}
 */
function normalizeDistance(distance = 0) {
  if (typeof distance !== 'object')
    distance = { top: distance, left: distance, right: distance, bottom: distance };

  return distance;
}

/**
 * Given two objects containing "top", "left", "offsetWidth" and "offsetHeight"
 * properties, determine if they collide.
 * @param  {Object|HTMLElement} a
 * @param  {Object|HTMLElement} b
 * @return {bool}
 */
export function objectsCollide(nodeA, nodeB, tolerance = 0) {
  let { top: aTop, left: aLeft, right: aRight = aLeft, bottom: aBottom = aTop } = getBoundsForNode(nodeA);
  let { top: bTop, left: bLeft, right: bRight = bLeft, bottom: bBottom = bTop } = getBoundsForNode(nodeB);

  return !(
    // 'a' bottom doesn't touch 'b' top
    ((aBottom - tolerance ) < bTop)  ||
    // 'a' top doesn't touch 'b' bottom
    ((aTop + tolerance) > (bBottom)) ||
    // 'a' right doesn't touch 'b' left
    ((aRight - tolerance) < bLeft )  ||
    // 'a' left doesn't touch 'b' right
    ((aLeft + tolerance) > (bRight) )
  );
}

/**
 * Given a node, get everything needed to calculate its boundaries
 * @param  {HTMLElement} node
 * @return {Object}
 */
export function getBoundsForNode(node) {
  if (!node.getBoundingClientRect) return node;

  var rect = node.getBoundingClientRect()
    , left = rect.left + pageOffset('left')
    , top = rect.top + pageOffset('top');

  return {
    top,
    left,
    right: (node.offsetWidth || 0) + left,
    bottom: (node.offsetHeight || 0) + top
  };
}

function pageOffset(dir) {
  if (dir === 'left')
    return (window.pageXOffset || document.body.scrollLeft || 0)
  if (dir === 'top')
    return (window.pageYOffset || document.body.scrollTop || 0)
}

export default Selection
