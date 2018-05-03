const os = require("os");
const fs = require("fs");
const path = require("path");
const chalk = require("chalk");
const moment = require("moment");
const debug = require("debug")("debug");

enum Commands {
  Remove = "remove",
  Complete = "complete",
  Nuke = "nuke",
  Help = "help"
}

class Task {
  public description: string;
  public date: Date;
  public complete: boolean;
  public id: number;

  constructor(
    description: string,
    date?: Date,
    complete?: boolean,
    id?: number
  ) {
    this.description = description;
    this.date = date || moment();
    this.complete = complete || false;
    this.id = id || Math.floor(Math.random() * 10000);
  }

  public toRaw(): string {
    let { id, description, date, complete } = this;
    date = moment(date).format();
    return `${id},${description},${date},${complete}`;
  }

  public static fromRaw(rawTask: string): Task {
    const [rawId, description, rawDate, rawComplete] = rawTask.split(",");

    const date: Date = moment(rawDate);
    const complete: boolean = rawComplete == "true";
    const id: number = parseInt(rawId, 10);

    return new Task(description, date, complete, id);
  }

  public static compare(a: Task, b: Task): number {
    // Prefer uncomplete to complete
    if (a.complete && !b.complete) {
      return 1;
    }

    if (b.complete && !a.complete) {
      return -1;
    }

    // Prefer older to younger
    return a.date > b.date ? 1 : -1;
  }
}

class TaskFormatter {
  public static format(task: Task): string {
    let { description, date, complete, id } = task;

    (id as any) = IDFormatter.format(id);
    (date as any) = DateFormatter.format(date);

    let result = `${id}${date}${description}`;

    if (complete) {
      result = `${result} ✔`;
    }

    return result;
  }
}

class IDFormatter {
  public static format(id: number): string {
    return (id.toString() as any).padEnd(6);
  }
}

class DateFormatter {
  public static format(date: Date): string {
    let formattedDate = moment(date).format("ddd, MMM D");
    (formattedDate as any) = formattedDate.padEnd(13);

    if (date < this.calculatePastDate(14)) {
      return chalk.red(formattedDate);
    }
    if (date < this.calculatePastDate(7)) {
      return chalk.yellow(formattedDate);
    }
    return chalk.green(formattedDate);
  }

  private static calculatePastDate(numDays: number): Date {
    return moment().subtract(numDays, "days");
  }
}

class TaskManager {
  private file: string;
  private tasks: Array<Task>;

  constructor(file: string) {
    this.file = file;

    // Create file if it does not already exist
    if (!fs.existsSync(this.file)) {
      debug(`Creating new .todo file: ${this.file}`);
      fs.appendFileSync(this.file, "");
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

    const rawTasks = fs.readFileSync(this.file, "utf8");
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
      fs.appendFileSync(this.file, task + "\n");
    });
  }
}

const FILE = `${os.homedir()}/.todo`;

const VERSION = "1.0";

const HELP = `Usage: todo [command]

Commands:
complete [id]       - Complete a task
remove [id]         - Remove a task
nuke                - Remove all tasks
help                - Print this help message

Examples:
todo                - List all tasks
todo Check my email - Add new task: "Check my email"
todo complete 874   - Complete task with id 874

Author: Sherwood Callaway
Code: http://github.com/shcallaway/todo
Version: ${VERSION}`;

(function main() {
  debug(`File: ${FILE}`);
  debug(`Version: ${VERSION}`);
  debug(`ARGV: ${process.argv}`);

  const tm = new TaskManager(FILE);

  switch (process.argv[2]) {
    case Commands.Remove:
      tm.removeTask(parseInt(process.argv[3]));
      break;
    case Commands.Complete:
      tm.completeTask(parseInt(process.argv[3]));
      break;
    case Commands.Nuke:
      fs.existsSync(FILE) && fs.unlinkSync(FILE);
      break;
    case Commands.Help:
      console.log(HELP);
      break;
    default:
      // When no other command is provided, either
      // create a new task or list existing tasks
      const description = process.argv.slice(2).join(" ");
      if (description.length) {
        tm.createTask(description);
      } else {
        tm.printTasks();
      }
  }
})();
