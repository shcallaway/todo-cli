const os = require("os");
const fs = require("fs");
const path = require("path");
const chalk = require("chalk");
const moment = require("moment");
const debug = require("debug")("TaskManager");

import Task from "./Task";
import TaskFormatter from "./TaskFormatter";
import Commands from "./Commands";

export default class TaskManager {
  private file: string;
  private tasks: Array<Task>;

  constructor(file: string) {
    this.file = file;

    // Create file if it does not already exist
    if (!this.fileExists()) {
      debug(`Creating new .todo file: ${this.file}`);
      this.appendDataToFile("");
    }

    debug(`Using .todo file: ${this.file}`);
    this.tasks = this.getTasks();
  }

  public createTask(description: string): void {
    debug(`Creating task with description: ${description}`);

    const task = new Task(description.trim());
    this.tasks.push(task);
    this.log(`Added: ${task.description}`);

    this.setTasks();
  }

  // TODO: #completeTasks and #removeTasks should share more code

  public completeTasks(ids: number[]): void {
    const failure = [];
    const success = [];

    ids.forEach(id => {
      if (this.completeTask(id)) {
        success.push(id)
      } else {
        failure.push(id);
      }
    });

    if (success.length) {
      this.log(`Completed: ${success.join(", ")}`);
    }

    if (failure.length) {
      this.log(`Could not find: ${failure.join(", ")}`)
    }
  }

  public removeTasks(ids: number[]): void {
    const failure = [];
    const success = [];

    ids.forEach(id => {
      if (this.removeTask(id)) {
        success.push(id)
      } else {
        failure.push(id);
      }
    });

    if (success.length) {
      this.log(`Removed: ${success.join(", ")}`);
    }

    if (failure.length) {
      this.log(`Could not find: ${failure.join(", ")}`)
    }
  }

  public printTasks(): void {
    debug(`Printing tasks.`);

    this.tasks.sort(Task.compare).forEach(task => {
      this.log(TaskFormatter.format(task));
    });

    if (!this.tasks.length) {
      this.log(`There's nothing here! Try \"${Commands.Help}\".`);
    }
  }

  private completeTask(id: number): boolean {
    debug(`Completing task with id: ${id}`);
    const i = this.getTaskPosition(id);

    if (i < 0) {
      return false
    };

    this.tasks[i].complete = true;
    debug(`Completed: ${this.tasks[i].description}`);
    this.setTasks();

    return true;
  }

  private removeTask(id: number): boolean {
    debug(`Removing task with id: ${id}`);
    const i = this.getTaskPosition(id);

    if (i < 0) {
      return false
    };

    const task = this.tasks[i];
    this.tasks.splice(i, 1);
    debug(`Removed: ${task.description}`);
    this.setTasks();

    return true;
  }

  private log(message: string): void {
    console.log(message);
  }

  private appendDataToFile(data: string): void {
    fs.appendFileSync(this.file, data);
  }

  private fileExists(): boolean {
    return fs.existsSync(this.file);
  }

  private readFile(): string {
    return fs.readFileSync(this.file, "utf8");
  }

  private deleteFile(): void {
    fs.unlinkSync(this.file);
  }

  private getTaskPosition(id: number): number {
    debug(`Finding position of task with id: ${id}`);

    if (!(id && typeof id === "number")) {
      debug(`Could not find task with id: ${id}`);
      return -1;
    }

    for (let i = 0; i < this.tasks.length; i++) {
      const task = this.tasks[i];
      if (task.id === id) {
        return i;
      }
    }

    debug(`Could not find task with id: ${id}`);
    return -1;
  }

  private getTasks(): Array<Task> {
    debug(`Getting tasks from file.`);

    const rawTasks = this.readFile();
    return rawTasks
      .split("\n")
      .map(rawTask => Task.fromRaw(rawTask))
      .filter(task => {
        // Filter tasks with missing or invalid properties
        return task.description && task.date && task.id;
      });
  }

  private setTasks(): void {
    debug(`Overwriting tasks file with new data.`);

    this.fileExists() && this.deleteFile();
    this.tasks.map(task => task.toRaw()).forEach(task => {
      // Write each task to a new line
      this.appendDataToFile(task + "\n");
    });
  }
}
