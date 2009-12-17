// ========================================================================
// SproutCore -- JavaScript Application Framework
// Copyright ©2006-2008, Sprout Systems, Inc. and contributors.
// Portions copyright ©2008 Apple Inc.  All rights reserved.
// ========================================================================

var SC = require('core');

require('controllers/controller');
require('mixins/selection_support');

/**
  @class

  An ArrayController provides a way for you to publish an array of objects
  for CollectionView or other controllers to work with.  To work with an 
  ArrayController, set the content property to the array you want the 
  controller to manage.  Then work directly with the controller object as if
  it were the array itself.
  
  When you want to display an array of objects in a CollectionView, bind the
  "arrangedObjects" of the array controller to the CollectionView's "content"
  property.  This will automatically display the array in the collection view.

  @extends SC.Controller
  @extends SC.Array
  @extends SC.SelectionSupport
  @author Charles Jolley
  @since SproutCore 1.0
*/
SC.ArrayController = SC.Controller.extend(SC.Array, SC.SelectionSupport,
/** @scope SC.ArrayController.prototype */ {

  // ..........................................................
  // PROPERTIES
  // 
  
  /**
    The content array managed by this controller.  
    
    You can set the content of the ArrayController to any object that 
    implements SC.Array or SC.Enumerable.  If you set the content to an object
    that implements SC.Enumerable only, you must also set the orderBy property
    so that the ArrayController can order the enumerable for you.
    
    If you set the content to a non-enumerable and non-array object, then the
    ArrayController will wrap the item in an array in an attempt to normalize
    the result.
    
    @property {SC.Array}
  */
  content: null,

  /**
    Makes the array editable or not.  If this is set to false, then any attempts
    at changing the array content itself will throw an exception.
    
    @property {Boolean}
  */
  isEditable: true,
  
  /**
    Used to sort the array.
    
    If you set this property to a key name, array of key names, or a function,
    then then ArrayController will automatically reorder your content array
    to match the sort order.  (If you set a function, the function will be
    used to sort).

    Normally, you should only use this property if you set the content of the
    controller to an unordered enumerable such as SC.Set or SC.SelectionSet.
    In this case the orderBy property is required in order for the controller
    to property order the content for display.
    
    If you set the content to an array, it is usually best to maintain the 
    array in the proper order that you want to display things rather than 
    using this method to order the array since it requires an extra processing
    step.  You can use this orderBy property, however, for displaying smaller 
    arrays of content.
    
    Note that you can only to use addObject() to insert new objects into an
    array that is ordered.  You cannot manually reorder or insert new objects
    into specific locations because the order is managed by this property 
    instead.
    
    If you pass a function, it should be suitable for use in compare().
    
    @property {String|Array|Function}
  */
  orderBy: null,
    
  /**
    Set to true if you want the controller to wrap non-enumerable content    
    in an array and publish it.  Otherwise, it will treat single content like 
    null content.
    
    @property {Boolean}
  */
  allowsSingleContent: true,
  
  /**
    Set to true if you want objects removed from the array to also be
    deleted.  This is a convenient way to manage lists of items owned
    by a parent record object.
    
    Note that even if this is set to false, calling destroyObject() instead of
    removeObject() will still destroy the object in question as well as 
    removing it from the parent array.
    
    @property {Boolean}
  */
  destroyOnRemoval: false,

  /**
    Returns an SC.Array object suitable for use in a CollectionView.  
    Depending on how you have your ArrayController configured, this property
    may be one of several different values.  
    
    @property {SC.Array}
  */
  arrangedObjects: function() {
    return this;
  }.property().cacheable(),
  
  /**
    Computed property indicates whether or not the array controller can 
    remove content.  You can delete content only if the content is not single
    content and isEditable is true.
    
    @property {Boolean}
  */
  canRemoveContent: function() {
    var content = this.get('content'), ret;
    ret = !!content && this.get('isEditable') && this.get('hasContent');
    if (ret) {
      return !content.isEnumerable || 
             (SC.typeOf(content.removeObject) === SC.T_FUNCTION);
    } else return false ;
  }.property('content', 'isEditable', 'hasContent'),
  
  /**
    Computed property indicates whether you can reorder content.  You can
    reorder content as long a the controller isEditable and the content is a
    real SC.Array-like object.  You cannot reorder content when orderBy is
    non-null.
    
    @property {Boolean}
  */
  canReorderContent: function() {
    var content = this.get('content'), ret;
    ret = !!content && this.get('isEditable') && !this.get('orderBy');
    return ret && !!content.isSCArray;
  }.property('content', 'isEditable', 'orderBy'),
  
  /**
    Computed property insides whether you can add content.  You can add 
    content as long as the controller isEditable and the content is not a 
    single object.
    
    Note that the only way to simply add object to an ArrayController is to
    use the addObject() or pushObject() methods.  All other methods imply 
    reordering and will fail.
    
    @property {Boolean}
  */
  canAddContent: function() {
    var content = this.get('content'), ret ;
    ret = content && this.get('isEditable') && content.isEnumerable;
    if (ret) {
      return (SC.typeOf(content.addObject) === SC.T_FUNCTION) || 
             (SC.typeOf(content.pushObject) === SC.T_FUNCTION); 
    } else return false ;
  }.property('content', 'isEditable'),
  
  /**
    Set to true if the controller has valid content that can be displayed,
    even an empty array.  Returns false if the content is null or not enumerable
    and allowsSingleContent is false.
    
    @property {Boolean}
  */
  hasContent: function() {
    var content = this.get('content');
    return !!content && 
           (!!content.isEnumerable || !!this.get('allowsSingleContent'));
  }.property('content', 'allowSingleContent'),

  /**
    Returns the current status property for the content.  If the content does
    not have a status property, returns SC.Record.READY.
    
    @property {Number}
  */
  status: function() {
    var content = this.get('content'),
        ret = content ? content.get('status') : null;
    return ret ? ret : SC.Record.READY;
  }.property().cacheable(),
  
  // ..........................................................
  // METHODS
  // 
  
  /**
    Adds an object to the array.  If the content is ordered, this will add the 
    object to the end of the content array.  The content is not ordered, the
    location depends on the implementation of the content.
    
    If the source content does not support adding an object, then this method 
    will throw an exception.
    
    @param {Object} object the object to add
    @returns {SC.ArrayController} receiver
  */
  addObject: function(object) {
    if (!this.get('canAddContent')) throw "%@ cannot add content".fmt(this);
    
    var content = this.get('content');
    if (content.isSCArray) content.pushObject(object);
    else if (content.addObject) content.addObject(object);
    else throw "%@.content does not support addObject".fmt(this);
    
    return this;
  },
  
  /**
    Removes the passed object from the array.  If the underyling content 
    is a single object, then this simply sets the content to null.  Otherwise
    it will call removeObject() on the content.
    
    Also, if destroyOnRemoval is true, this will actually destroy the object.
    
    @param {Object} object the object to remove
    @returns {SC.ArrayController} receiver
  */
  removeObject: function(object) {
    if (!this.get('canRemoveContent')) {
      throw "%@ cannot remove content".fmt(this);
    }
    
    var content = this.get('content');
    if (content.isEnumerable) content.removeObject(object);
    else {
      this.set('content', null);
    }
    
    if (this.get('destroyOnRemoval') && object.destroy) object.destroy();
    return this; 
  },
  
  // ..........................................................
  // SC.ARRAY SUPPORT
  // 

  /**
    Compute the length of the array based on the observable content
    
    @property {Number}
  */
  length: function() {
    var content = this._scac_observableContent();
    return content ? content.get('length') : 0;
  }.property().cacheable(),

  /** @private
    Returns the object at the specified index based on the observable content
  */
  objectAt: function(idx) {
    var content = this._scac_observableContent();
    return content ? content.objectAt(idx) : undefined ;    
  },
  
  /** @private
    Forwards a replace on to the content, but only if reordering is allowed.
  */
  replace: function(start, amt, objects) {
    // check for various conditions before a replace is allowed
    if (!objects || objects.get('length')===0) {
      if (!this.get('canRemoveContent')) {
        throw "%@ cannot remove objects from the current content".fmt(this);
      }
    } else if (!this.get('canReorderContent')) {
      throw "%@ cannot add or reorder the current content".fmt(this);
    }    
    
    // if we can do this, then just forward the change.  This should fire
    // updates back up the stack, updating rangeObservers, etc.
    var content = this.get('content'); // note: use content, not observable
    var objsToDestroy = [], i, objsLen;
    if (this.get('destroyOnRemoval')){
      for(i=0; i<amt; i++){
        objsToDestroy.push(content.objectAt(i+start));
      }
    }
    
    if (content) content.replace(start, amt, objects);
    for(i=0, objsLen = objsToDestroy.length; i<objsLen; i++){
      
      objsToDestroy[i].destroy();
    }
    objsToDestroy = null;
    
    return this; 
  },

  indexOf: function(object, startAt) {
    var content = this._scac_observableContent();
    return content ? content.indexOf(object, startAt) : -1;
  },

  // ..........................................................
  // INTERNAL SUPPORT
  // 
  
  /** @private */
  init: function() {
    sc_super();
    this._scac_contentDidChange();
  },
  
  /** @private
    Cached observable content property.  Set to false to indicate cache is 
    invalid.
  */
  _scac_cached: false,
  
  /**
    @private
    
    Returns the current array this controller is actually managing.  Usually
    this should be the same as the content property, but sometimes we need to
    generate something different because the content is not a regular array.
    
    Passing true to the force parameter will force this value to be recomputed.
  
    @returns {SC.Array} observable or null
  */
  _scac_observableContent: function() {
    var ret = this._scac_cached;
    if (ret !== false) return ret;
    
    var content = this.get('content'),
        orderBy, func, t, len;
    
    // empty content
    if (SC.none(content)) return this._scac_cached = [];

    // wrap non-enumerables
    if (!content.isEnumerable) {
      ret = this.get('allowsSingleContent') ? [content] : [];
      return (this._scac_cached = ret);
    } 
    
    // no-wrap
    orderBy = this.get('orderBy');
    if (!orderBy) {
      if (content.isSCArray) return (this._scac_cached = content) ;
      else throw "%@.orderBy is required for unordered content".fmt(this);     
    }
    
    // all remaining enumerables must be sorted.
    
    // build array - then sort it
    switch(SC.typeOf(orderBy)) {
    case SC.T_STRING:
      orderBy = [orderBy];
      break;
    case SC.T_FUNCTION:
      func = orderBy ;
      break;
    case SC.T_ARRAY:
      break;
    default:
      throw "%@.orderBy must be Array, String, or Function".fmt(this);
    }
        
    // generate comparison function if needed - use orderBy
    if (!func) {  
      len = orderBy.get('length');
      func = function(a,b) {
        var idx=0, status=0, key, aValue, bValue;
        for(idx=0;(idx<len)&&(status===0);idx++) {
          key = orderBy.objectAt(idx);
        
          if (!a) aValue = a ;
          else if (a.isObservable) aValue = a.get(key);
          else aValue = a[key];

          if (!b) bValue = b ;
          else if (b.isObservable) bValue = b.get(key);
          else bValue = b[key];
        
          status = SC.compare(aValue, bValue);
        }
        return status ; 
      };
    }

    ret = [];
    content.forEach(function(o) { ret.push(o); });
    ret.sort(func);
    
    func = null ; // avoid memory leaks
    return (this._scac_cached = ret) ;
  },
  
  /** @private
    Whenever content changes, setup and teardown observers on the content
    as needed.
  */
  _scac_contentDidChange: function() {

    this._scac_cached = false; // invalidate observable content
    
    var cur    = this.get('content'),
        orders = !!this.get('orderBy'),
        last   = this._scac_content,
        oldlen = this._scac_length || 0,
        ro     = this._scac_rangeObserver,
        func   = this._scac_rangeDidChange,
        efunc  = this._scac_enumerableDidChange,
        sfunc  = this._scac_contentStatusDidChange,
        newlen;
        
    if (last === cur) return this; // nothing to do

    // teardown old observer
    if (last) {
      if (ro && last.isSCArray) last.removeRangeObserver(ro);
      else if (last.isEnumerable) last.removeObserver('[]', this, efunc);
      last.removeObserver('status', this, sfunc);
    }
    
    ro = null;
    
    // save new cached values 
    this._scac_cached = false;
    this._scac_content = cur ;
    
    // setup new observers
    // also, calculate new length.  do it manually instead of using 
    // get(length) because we want to avoid computed an ordered array.
    if (cur) {
      if (!orders && cur.isSCArray) ro = cur.addRangeObserver(null,this,func);
      else if (cur.isEnumerable) cur.addObserver('[]', this, efunc);
      newlen = cur.isEnumerable ? cur.get('length') : 1; 
      cur.addObserver('status', this, sfunc);
      
    } else newlen = SC.none(cur) ? 0 : 1;

    this._scac_rangeObserver = ro;
    

    // finally, notify enumerable content has changed.
    this._scac_length = newlen;
    this._scac_contentStatusDidChange();
    this.enumerableContentDidChange(0, newlen, newlen - oldlen);
    this.updateSelectionAfterContentChange();
  }.observes('content'),
  
  /** @private
    Whenever enumerable content changes, need to regenerate the 
    observableContent and notify that the range has changed.  
    
    This is called whenever the content enumerable changes or whenever orderBy
    changes.
  */
  _scac_enumerableDidChange: function() {
    var content = this.get('content'), // use content directly
        newlen  = content ? content.get('length') : 0,
        oldlen  = this._scac_length;
        
    this._scac_length = newlen;
    this.beginPropertyChanges();
    this._scac_cached = false; // invalidate
    this.enumerableContentDidChange(0, newlen, newlen-oldlen);
    this.endPropertyChanges();
    this.updateSelectionAfterContentChange();
  }.observes('orderBy'),
  
  /** @private
    Whenever array content changes, need to simply forward notification.
    
    Assumes that content is not null and is SC.Array.
  */
  _scac_rangeDidChange: function(array, objects, key, indexes) {
    if (key !== '[]') return ; // nothing to do
    
    var content = this.get('content');
    this._scac_length = content.get('length');
    this._scac_cached = false; // invalidate
    
    // if array length has changed, just notify every index from min up
    if (indexes) {
      this.beginPropertyChanges();
      indexes.forEachRange(function(start, length) {
        this.enumerableContentDidChange(start, length, 0);
      }, this);
      this.endPropertyChanges();
      this.updateSelectionAfterContentChange();
    }
  },
  
  /** @private
    Whenver the content "status" property changes, relay out.
  */
  _scac_contentStatusDidChange: function() {
    this.notifyPropertyChange('status');
  }
  
});
