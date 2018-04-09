const fs = require("fs");
const path = require("path");
const chalk = require("chalk");
const moment = require("moment");

const FILE = "/coding/todo/.todo";

class CommandLineInterface {
  public static complete() {
    const id = parseInt(process.argv[3]);
    const tm = new TaskManager(FILE);

    if (id && typeof id === "number") {
      tm.completeTask(id);
    }

    process.exit(0);
  }

  public static remove() {
    const id = parseInt(process.argv[3]);
    const tm = new TaskManager(FILE);

    if (id && typeof id === "number") {
      tm.removeTask(id);
    }

    process.exit(0);
  }

  public static create() {
    const description = process.argv.slice(2).join(" ");
    const tm = new TaskManager(FILE);

    if (description.length) {
      tm.createTask(description);
      process.exit(0);
    }

    tm.printTasks();
  }

  public static nuke() {
    fs.existsSync(FILE) && fs.unlinkSync(FILE);
    process.exit(0);
  }

  public static help() {
    console.log(
      `Usage: todo [command]

Commands:
complete [id]       - Complete a task
remove [id]         - Remove a task
nuke                - Remove all tasks
help                - Print this help message

Examples:
todo                - List all tasks
todo Check my email - Add new task: "Check my email"
todo complete 874   - Complete task with id 874

Author: Sherwood Callaway`
    );
  }
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
    // On initialization, if local file does not exist, create it
    !fs.existsSync(this.file) && fs.appendFileSync(this.file, "");
    this.tasks = this.getTasks();
  }

  public createTask(description: string): void {
    const task = new Task(description.trim());
    this.tasks.push(task);
    console.log(`Added: ${task.description}`);

    this.setTasks();
  }

  public completeTask(id: number): void {
    this.tasks.forEach(task => {
      if (task.id === id) {
        task.complete = true;
        console.log(`Completed: ${task.description}`);
      }
    });

    this.setTasks();
  }

  public removeTask(id: number): void {
    this.tasks.forEach((task, i) => {
      if (task.id === id) {
        this.tasks.splice(i, 1);
        console.log(`Removed: ${task.description}`);
        return;
      }
    });

    this.setTasks();
  }

  public printTasks(): void {
    this.tasks.sort(Task.compare).forEach(task => {
      console.log(TaskFormatter.format(task));
    });

    if (!this.tasks.length) {
      console.log("Nothing here.");
    }
  }

  private getTasks(): Array<Task> {
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
    fs.existsSync(this.file) && fs.unlinkSync(this.file);
    this.tasks.map(task => task.toRaw()).forEach(task => {
      // Write each task to a new line
      fs.appendFileSync(this.file, task + "\n");
    });
  }
}

switch (process.argv[2]) {
  case "remove":
    CommandLineInterface.remove();
    break;
  case "complete":
    CommandLineInterface.complete();
    break;
  case "nuke":
    CommandLineInterface.nuke();
    break;
  case "help":
    CommandLineInterface.help();
    break;
  default:
    // When no other command is provided, either
    // create a new task or list existing tasks
    CommandLineInterface.create();
}
