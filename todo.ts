const fs = require("fs");
const yargs = require("yargs");
const path = require("path");
const chalk = require("chalk");
const moment = require("moment");

class Task {
  public description: string;
  public date: Date;
  public complete: boolean;
  public identifier: number;

  constructor(
    description: string,
    date?: Date,
    complete?: boolean,
    identifier?: number
  ) {
    this.description = description;
    this.date = date || moment();
    this.complete = complete || false;
    this.identifier = identifier || Math.floor(Math.random() * 10000);
  }

  public toRaw(): string {
    let { identifier, description, date, complete } = this;
    date = moment(date).format();
    return `${identifier},${description},${date},${complete}`;
  }

  public static fromRaw(rawTask: string): Task {
    const [rawId, description, rawDate, rawComplete] = rawTask.split(",");

    const date: Date = moment(rawDate);
    const complete: boolean = rawComplete == "true";
    const identifier: number = parseInt(rawId, 10);

    return new Task(description, date, complete, identifier);
  }

  public static compare(a: Task, b: Task): number {
    if (a.complete && !b.complete) {
      return 1;
    }

    if (b.complete && !a.complete) {
      return -1;
    }

    // Oldest to youngest
    return a.date > b.date ? 1 : -1;
  }
}

interface ARGV {
  _: Array<string>;
}

interface Formatter {
  format(thing: any): string;
}

class TaskFormatter implements Formatter {
  public format(task: Task): string {
    let { description, date, complete, identifier } = task;

    const identifierFormatter = new IdentifierFormatter();
    const dateFormatter = new DateFormatter();

    (identifier as any) = identifierFormatter.format(identifier);
    (date as any) = dateFormatter.format(date);

    let result = `${identifier}${date}${description}`;

    if (complete) {
      result = `${result} ✔`;
    }

    return result;
  }
}

class IdentifierFormatter implements Formatter {
  public format(identifier: number): string {
    return (identifier.toString() as any).padEnd(6);
  }
}

class DateFormatter implements Formatter {
  public format(date: Date): string {
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

  private calculatePastDate(numDays: number): Date {
    return moment().subtract(numDays, "days");
  }
}

class TaskManager {
  public static create(description: string): void {
    const formatter = new TaskFormatter();
    const task = new Task(description.trim());
    TASKS.push(task);
    console.log(`Added: ${formatter.format(task)}`);
  }

  public static complete(identifier: number): void {
    const formatter = new TaskFormatter();
    TASKS.forEach(task => {
      if (task.identifier === identifier) {
        task.complete = true;
        console.log(`Completed: ${formatter.format(task)}`);
      }
    });
  }

  public static remove(identifier: number): void {
    const formatter = new TaskFormatter();
    TASKS.forEach((task, i) => {
      if (task.identifier === identifier) {
        TASKS.splice(i, 1);
        console.log(`Removed: ${formatter.format(task)}`);
        return;
      }
    });
  }

  public static print(tasks: Array<Task>): void {
    const formatter = new TaskFormatter();
    tasks.sort(Task.compare).forEach(task => {
      console.log(formatter.format(task));
    });

    if (!tasks.length) {
      console.log("There's nothing here.");
    }
  }
}

class FileSystem {
  public static getTasks(): Array<Task> {
    const rawTasks = fs.readFileSync(FILE, "utf8");
    return rawTasks
      .split("\n")
      .map(rawTask => Task.fromRaw(rawTask))
      .filter(task => {
        // Filter out tasks with missing or invalid properties
        return task.description && task.date && task.identifier;
      });
  }

  public static putTasks(tasks: Array<Task>): void {
    fs.existsSync(FILE) && fs.unlinkSync(FILE);
    tasks.map(task => task.toRaw()).forEach(task => {
      // Write each task to a new line
      fs.appendFileSync(FILE, task + "\n");
    });
  }
}

const FILE = "/coding/todo/.todo";

(function initialize() {
  !fs.existsSync(FILE) && fs.appendFileSync(FILE, "");
})();

const TASKS = FileSystem.getTasks();

yargs
  .usage("Usage: todo [command] [options]")
  .command("", "Create a new task or list uncompleted tasks")
  .command("complete", "Complete a task or list completed tasks", complete)
  .command("nuke", "Clear all tasks", nuke)
  .command("remove", "Remove a task", remove)
  .help();

function complete() {
  const identifier = yargs.argv._[1];

  if (identifier && typeof identifier === "number") {
    TaskManager.complete(identifier);
    FileSystem.putTasks(TASKS);
  }

  process.exit(0);
}

function nuke() {
  fs.existsSync(FILE) && fs.unlinkSync(FILE);
  process.exit(0);
}

function remove() {
  console.log("Implement me!");
  process.exit(0);
}

// This is the default behavior, when no
// other command is provided
(function create() {
  const description = yargs.argv._.join(" ");

  if (description.length) {
    TaskManager.create(description);
    FileSystem.putTasks(TASKS);
    process.exit(0);
  }

  TaskManager.print(TASKS);
})();
