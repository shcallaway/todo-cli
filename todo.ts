const fs = require("fs");
const yargs = require("yargs");
const path = require("path");
const chalk = require("chalk");
const moment = require("moment");

interface Task {
  description: string;
  date: Date;
  complete: boolean;
  identifier: number;
}

interface TaskUpdates {
  description?: string;
  date?: Date;
  complete?: boolean;
  identifier?: number;
}

interface Formatter {
  format(thing: any): string;
}

interface ARGV {
  _: Array<string>;
}

const FILE = "/coding/todo/.todo";

const SEEDS = [
  {
    description: "Hello world",
    date: moment(),
    complete: false,
    identifier: generatePseudoRandomID()
  },
  {
    description: "Hello world",
    date: moment().subtract(8, "days"),
    complete: false,
    identifier: generatePseudoRandomID()
  },
  {
    description: "Hello world",
    date: moment().subtract(20, "days"),
    complete: false,
    identifier: generatePseudoRandomID()
  }
];

class FileStorage {
  public static read(path: string): string {
    return fs.readFileSync(path, "utf8");
  }

  public static append(path: string, data: string): void {
    fs.appendFileSync(path, data + "\n");
  }

  public static exists(path: string): boolean {
    return fs.existsSync(path);
  }

  public static destroy(path: string): void {
    fs.unlinkSync(path);
  }
}

class TaskFormatter implements Formatter {
  public format(task: Task): string {
    let { description, date, complete, identifier } = task;

    const identifierFormatter = new IdentifierFormatter();
    const dateFormatter = new DateFormatter();

    (identifier as any) = identifierFormatter.format(identifier);
    (date as any) = dateFormatter.format(date);

    description = this.formatDescription(description);
    let result = `${identifier}${date}${description}`;

    // Format complete tasks more simply
    if (complete) {
      date = chalk.reset(date);
      result = `${date}${description}`;
    }

    return result;
  }

  private formatDescription(description: string): string {
    return chalk.italic(description);
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

function taskCompare(a: Task, b: Task): number {
  // Prefer older tasks to younger ones
  return a.date > b.date ? 1 : -1;
}

class TaskList {
  private path: string;
  private tasks: Array<Task>;
  private formatter: TaskFormatter;

  constructor(path: string) {
    this.path = path;
    this.tasks = this.load();
    this.formatter = new TaskFormatter();
  }

  public printUncompletedTasks(): void {
    const tasks = this.tasks.filter(task => {
      return !task.complete;
    });

    this.printTasks(tasks);
  }

  public printCompletedTasks(): void {
    const tasks = this.tasks.filter(task => {
      return task.complete;
    });

    this.printTasks(tasks);
  }

  public complete(identifier: number): void {
    if (!this.exists(identifier)) {
      console.log("Could not find task with ID: " + identifier);
      return;
    }

    const task = this.update(identifier, { complete: true });
    this.save();

    console.log("Completed: " + this.formatter.format(task));
  }

  public add(task: Task): Task {
    this.tasks.push(task);
    this.save();

    console.log("Added: " + this.formatter.format(task));
    return task;
  }

  private printTasks(tasks: Array<Task>) {
    tasks.sort(taskCompare).forEach(task => {
      console.log(this.formatter.format(task));
    });

    if (!tasks.length) {
      console.log("Nothing here.");
    }
  }

  private update(identifier: number, updates: TaskUpdates): Task {
    let task: Task = this.remove(identifier);
    task = (Object as any).assign(task, updates);
    this.tasks.push(task);
    return task;
  }

  private load(): Array<Task> {
    if (!FileStorage.exists(this.path)) {
      return [] as Array<Task>;
    }

    return FileStorage.read(this.path)
      .split("\n")
      .filter(rawTask => this.validateRawTask(rawTask))
      .map(rawTask => this.convertRawTask(rawTask));
  }

  private exists(identifier: number): boolean {
    return !!this.find(identifier);
  }

  private find(identifier: number): number {
    for (let i = 0; i < this.tasks.length; i++) {
      if (this.tasks[0].identifier === identifier) {
        return i;
      }
    }

    return -1;
  }

  private remove(identifier: number): Task {
    const index = this.find(identifier);
    return this.tasks.splice(index, 1)[0];
  }

  private save(): void {
    if (FileStorage.exists(this.path)) {
      FileStorage.destroy(this.path);
    }

    this.tasks.forEach(task => {
      FileStorage.append(this.path, this.formatTaskAsRaw(task));
    });
  }

  // TODO: Create a class for CSV string to object conversion
  // and remove notion of "raw" from TaskList

  private formatTaskAsRaw(task: Task): string {
    let { identifier, description, date, complete } = task;
    date = moment(date).format();
    return `${identifier},${description},${date},${complete}`;
  }

  private validateRawTask(rawTask) {
    const [identifier, description, rawDate] = rawTask.split(",");
    return identifier && description && rawDate;
  }

  private convertRawTask(rawTask: string): Task {
    const [rawIdentifier, description, rawDate, rawComplete] = rawTask.split(
      ","
    );

    const date: Date = moment(rawDate);
    const complete: boolean = rawComplete == "true";
    const identifier: number = parseInt(rawIdentifier, 10);

    return { identifier, description, date, complete } as Task;
  }
}

yargs
  .usage("Usage: todo [command] [options]")
  .command("", "Add a new task or list uncompleted tasks")
  .command("complete", "Complete a task or list completed tasks", function() {
    const identifier = yargs.argv._[1];
    const list = new TaskList(FILE);

    if (!isInteger(identifier)) {
      list.printCompletedTasks();
      process.exit(0);
    }

    list.complete(identifier);
    process.exit(0);
  })
  .command("nuke", "Clear all tasks", function() {
    if (FileStorage.exists(FILE)) {
      FileStorage.destroy(FILE);
    }
    process.exit(0);
  })
  .command("seed", "Seed some example tasks", function() {
    if (FileStorage.exists(FILE)) {
      FileStorage.destroy(FILE);
    }
    const list = new TaskList(FILE);
    SEEDS.forEach(task => list.add(task));
    process.exit(0);
  })
  .help();

function isInteger(value: any): boolean {
  return value && typeof value === "number";
}

function getDescription(argv: ARGV): string {
  return yargs.argv._.join(" ");
}

function generatePseudoRandomID(): number {
  return Math.floor(Math.random() * 10000);
}

const list = new TaskList(FILE);
const description = getDescription(yargs.argv);

// If there is no description provided, assume they meant ls
if (!description.length) {
  list.printUncompletedTasks();
  process.exit(0);
}

const task: Task = {
  date: moment(),
  description: description,
  complete: false,
  identifier: generatePseudoRandomID()
};

list.add(task);
