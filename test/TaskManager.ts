import "mocha";
import * as sinon from "sinon";
import * as assert from "assert";

import TaskManager from "../src/TaskManager";

const FILE = "/coding/todo/tmp/tasks";

describe("TaskManager", function() {
  let fileExistsStub, appendDataToFileStub, readFileStub, tm;

  beforeEach(function() {
    fileExistsStub = sinon.stub(TaskManager.prototype, "fileExists");
    appendDataToFileStub = sinon.stub(
      TaskManager.prototype,
      "appendDataToFile"
    );
    readFileStub = sinon.stub(TaskManager.prototype, "readFile");
  });

  afterEach(function() {
    fileExistsStub.restore();
    appendDataToFileStub.restore();
    readFileStub.restore();
  });

  it("should do some stuff if data file exists", function() {
    fileExistsStub.returns(true);
    readFileStub.returns("");

    tm = new TaskManager(FILE);

    assert.ok(fileExistsStub.called);
  });

  it.skip("should do some other stuff if data file exists", function() {});
});
