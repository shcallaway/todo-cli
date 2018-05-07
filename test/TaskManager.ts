import "mocha";
import * as sinon from "sinon";
import * as assert from "assert";

import TaskManager from "../src/TaskManager";
import Task from "../src/Task";
import Commands from "../src/Commands";

const FILE = "/coding/todo/tmp/tasks";

const RAW_TASKS = [
  "8133,buy groceries,2018-04-09T12:21:22-04:00,false",
  "2924,check my email,2018-04-09T12:38:42-04:00,false",
  "1234,go camping,2018-08-09T11:59:40-04:00,false"
];

// TODO: Use Chai assertions for better readability

describe("TaskManager", function() {
  let fileExists, appendDataToFile, readFile, setTasks, log, tm;

  beforeEach(function() {
    fileExists = sinon.stub(TaskManager.prototype, "fileExists").returns(true);
    readFile = sinon
      .stub(TaskManager.prototype, "readFile")
      .returns(RAW_TASKS.join("\n"));
    appendDataToFile = sinon.stub(TaskManager.prototype, "appendDataToFile");
    setTasks = sinon.stub(TaskManager.prototype, "setTasks");
    log = sinon.stub(TaskManager.prototype, "log");

    tm = new TaskManager(FILE);
  });

  afterEach(function() {
    fileExists.restore();
    appendDataToFile.restore();
    readFile.restore();
    setTasks.restore();
    log.restore();
  });

  describe("#constructor", function() {
    it("should check if data file exists", function() {
      assert.ok(fileExists.called);
    });

    it("should create data file if it does not exist", function() {
      fileExists.returns(false);
      tm = new TaskManager(FILE);
      assert.ok(appendDataToFile.called);
    });

    it("should populate tasks from raw data", function() {
      assert.equal(tm.tasks.length, RAW_TASKS.length);
      assert.deepEqual(tm.tasks[0], Task.fromRaw(RAW_TASKS[0]));
      assert.deepEqual(tm.tasks[1], Task.fromRaw(RAW_TASKS[1]));
    });
  });

  describe("#createTask", function() {
    it("should add new task to array", function() {
      assert.equal(tm.tasks.length, RAW_TASKS.length);
      tm.createTask("");
      assert.equal(tm.tasks.length, RAW_TASKS.length + 1);
    });

    it("should update data file", function() {
      tm.createTask("");
      assert.ok(setTasks.called);
    });

    it("should print message to console", function() {
      tm.createTask("");
      assert.ok(log.called);
    });
  });

  describe("#completeTasks", function() {
    let firstTask, secondTask;

    beforeEach(function() {
      firstTask = tm.tasks[0];
      secondTask = tm.tasks[1];
    });

    it("should complete task with given id", function() {
      assert.ok(!firstTask.complete);
      tm.completeTasks([firstTask.id]);
      assert.ok(firstTask.complete);
    });

    it("should complete multiple tasks given multiple valid ids", function() {
      assert.equal(tm.tasks.length, RAW_TASKS.length);
      tm.completeTasks([firstTask.id, secondTask.id]);
      assert.ok(firstTask.complete);
      assert.ok(secondTask.complete);
    });

    it("should not complete task or update data file given non-existent task id", function() {
      const id = Math.floor(Math.random() * 100000);
      tm.completeTasks([id]);
      assert.equal(tm.tasks[0].complete, false);
      assert.equal(setTasks.called, false);
    });

    it("should update data file", function() {
      tm.completeTasks([firstTask.id]);
      assert.ok(setTasks.called);
    });

    it("should print message to console", function() {
      tm.completeTasks([firstTask.id]);
      assert.ok(log.calledWith(`Completed: ${firstTask.description}`));
    });
  });

  describe("#removeTask", function() {
    let firstTask, secondTask;

    beforeEach(function() {
      firstTask = tm.tasks[0];
      secondTask = tm.tasks[1];
    });

    it("should remove task with given id from array", function() {
      assert.equal(tm.tasks.length, RAW_TASKS.length);
      tm.removeTasks([firstTask.id]);
      assert.equal(tm.tasks.length, RAW_TASKS.length - 1);
      assert.deepEqual(tm.tasks[0], Task.fromRaw(RAW_TASKS[1]));
    });

    it("should remove multiple tasks given multiple valid ids", function() {
      assert.equal(tm.tasks.length, RAW_TASKS.length);
      tm.removeTasks([firstTask.id, secondTask.id]);
      assert.equal(tm.tasks.length, RAW_TASKS.length - 2);
      assert.deepEqual(tm.tasks[0], Task.fromRaw(RAW_TASKS[2]));
    });

    it("should not remove task from array or update data file given non-existent task id", function() {
      const id = Math.floor(Math.random() * 100000);
      tm.removeTasks([id]);
      assert.equal(tm.tasks.length, RAW_TASKS.length);
      assert.equal(setTasks.called, false);
    });

    it("should update data file", function() {
      tm.removeTasks([firstTask.id]);
      assert.ok(setTasks.called);
    });

    it("should print message to console", function() {
      tm.removeTasks([firstTask.id]);
      assert.ok(log.calledWith(`Removed: ${firstTask.description}`));
    });
  });

  describe("#printTasks", function() {
    it("should print formatted tasks", function() {
      tm.printTasks();
      assert.ok(log.calledThrice);
    });

    it("should print different message when tasks array is empty", function() {
      tm.tasks = [];
      tm.printTasks();
      assert.ok(
        log.calledWith(`There's nothing here! Try \"${Commands.Help}\".`)
      );
    });
  });
});
