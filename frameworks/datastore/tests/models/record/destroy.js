// ==========================================================================
// Project:   SproutCore - JavaScript Application Framework
// Copyright: ©2006-2009 Apple, Inc. and contributors.
// License:   Licened under MIT license (see license.js)
// ==========================================================================
/*globals module ok equals same test MyApp */

var MyFoo = null, callInfo ;
module("SC.Record#destroy", {
  setup: function() {
    MyApp = SC.Object.create({
      store: SC.Store.create()
    })  ;
  
    MyApp.Foo = SC.Record.extend();
    MyApp.json = { 
      foo: "bar", 
      number: 123,
      bool: YES,
      array: [1,2,3] 
    };
    
    MyApp.foo = MyApp.store.createRecord(MyApp.Foo, MyApp.json);
    
    // modify store so that everytime refreshRecords() is called it updates 
    // callInfo
    callInfo = null ;
    MyApp.store.__orig = MyApp.store.destroyRecord;
    MyApp.store.destroyRecord = function(records) {
      callInfo = SC.A(arguments) ; // save method call
      MyApp.store.__orig.apply(MyApp.store, arguments); 
    };
  }
});

test("calling destroy on a newRecord will mark the record as destroyed and calls destroyRecords on the store", function() {
  equals(MyApp.foo.get('status'), SC.Record.READY_NEW, 'precond - status is READY_NEW');

  MyApp.foo.destroy();

  same(callInfo, [null, null, MyApp.foo.storeKey], 'destroyRecords() should not be called');
    
  equals(MyApp.foo.get('status'), SC.Record.DESTROYED_CLEAN, 'status should be SC.Record.DESTROYED_CLEAN');
});

test("calling destroy on existing record should call destroyRecord() on store", function() {

  // Fake it till you make it...
  MyApp.store.writeStatus(MyApp.foo.storeKey, SC.Record.READY_CLEAN)
    .dataHashDidChange(MyApp.foo.storeKey, null, YES);
    
  equals(MyApp.foo.get('status'), SC.Record.READY_CLEAN, 'precond - status is READY CLEAN');

  MyApp.foo.destroy();

  same(callInfo, [null, null, MyApp.foo.storeKey], 'destroyRecord() should not be called');
  equals(MyApp.foo.get('status'), SC.Record.DESTROYED_DIRTY, 'status should be SC.Record.DESTROYED_DIRTY');
});

test("calling destroy on a record that is already destroyed should do nothing", function() {

  // destroy once
  MyApp.foo.destroy();
  equals(MyApp.foo.get('status'), SC.Record.DESTROYED_CLEAN, 'status should be DESTROYED_CLEAN');
  
  MyApp.foo.destroy();
  equals(MyApp.foo.get('status'), SC.Record.DESTROYED_CLEAN, 'status should be DESTROYED_CLEAN');
});

test("should return receiver", function() {
  equals(MyApp.foo.destroy(), MyApp.foo, 'should return receiver');
});
