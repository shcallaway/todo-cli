const os = require("os");
const fs = require("fs");
const path = require("path");
const chalk = require("chalk");
const moment = require("moment");
const debug = require("debug")("debug");

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
    console.log(`Added: ${task.description}`);

    this.setTasks();
  }

  public completeTask(id: number): void {
    debug(`Completing task with id: ${id}`);

    const i = this.getTaskPosition(id);
    if (i < 0) return;

    this.tasks[i].complete = true;
    console.log(`Completed: ${this.tasks[i].description}`);

    this.setTasks();
  }

  public removeTask(id: number): void {
    debug(`Removing task with id: ${id}`);

    const i = this.getTaskPosition(id);
    if (i < 0) return;

    const task = this.tasks[i];
    this.tasks.splice(i, 1);
    console.log(`Removed: ${task.description}`);

    this.setTasks();
  }

  public printTasks(): void {
    debug(`Printing tasks.`);

    this.tasks.sort(Task.compare).forEach(task => {
      console.log(TaskFormatter.format(task));
    });

    if (!this.tasks.length) {
      console.log(`There's nothing here! Try \"${Commands.Help}\".`);
    }
  }

  private appendDataToFile(data: string): void {
    fs.appendFileSync(this.file, data);
  }

  private fileExists(): void {
    fs.existsSync(this.file);
  }
  
  private readFile(): string {
      return fs.readFileSync(this.file, "utf8");
  }

  private getTaskPosition(id: number): number {
    debug(`Finding position of task with id: ${id}`);

    if (!(id && typeof id === "number")) {
      console.log("Please enter a valid task id.");
      return -1;
    }

    for (let i = 0; i < this.tasks.length; i++) {
      const task = this.tasks[i];
      if (task.id === id) {
        return i;
      }
    }

    console.log(`Could not find task with id: ${id}`);
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

    fs.existsSync(this.file) && fs.unlinkSync(this.file);
    this.tasks.map(task => task.toRaw()).forEach(task => {
      // Write each task to a new line
      this.appendDataToFile(task + "\n");
    });
  }
}