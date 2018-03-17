const fs = require("fs");
const yargs = require("yargs");
const path = require("path");
const chalk = require("chalk");
const moment = require("moment");
const emoji = require("node-emoji");

enum TaskSize {
  Small = "Small",
  Medium = "Medium",
  Large = "Large"
}

interface Task {
  size: TaskSize;
  description: string;
  date: Date;
  complete: boolean;
  identifier: number;
}

interface TaskUpdates {
  size?: TaskSize;
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
  size: string;
}

const TASKS_FILE = "/coding/todo/.tasks";

const SEED_TASKS = [
  {
    size: TaskSize.Large,
    description: "Example A",
    date: moment().subtract(8, "days"),
    complete: false,
    identifier: generateRandomIdentifier()
  },
  {
    size: TaskSize.Medium,
    description: "Example B",
    date: moment(),
    complete: false,
    identifier: generateRandomIdentifier()
  },
  {
    size: TaskSize.Small,
    description: "Example C",
    date: moment().subtract(20, "days"),
    complete: true,
    identifier: generateRandomIdentifier()
  },
  {
    size: TaskSize.Medium,
    description: "Example C",
    date: moment().subtract(21, "days"),
    complete: false,
    identifier: generateRandomIdentifier()
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
    let { size, description, date, complete, identifier } = task;

    const identifierFormatter = new IdentifierFormatter();
    const dateFormatter = new DateFormatter();
    const taskSizeFormatter = new TaskSizeFormatter();

    (identifier as any) = identifierFormatter.format(identifier);
    (date as any) = dateFormatter.format(date);
    (size as any) = taskSizeFormatter.format(size);

    description = this.formatDescription(description);
    const result = `${identifier}${date}${size}${description}`;

    if (complete) {
      // ZSH does not support strikethrough
      return chalk.dim(result);
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

class TaskSizeFormatter implements Formatter {
  public format(taskSize: TaskSize): string {
    return chalk.bold((taskSize as any).padEnd(10));
  }
}

class DateFormatter implements Formatter {
  public format(date: Date): string {
    let formattedDate = moment(date).format("ddd, MMM D");
    (formattedDate as any) = formattedDate.padEnd(15);

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
  // Prefer uncompleted tasks
  if (a.complete && !b.complete) {
    return 1;
  }

  if (b.complete && !a.complete) {
    return -1;
  }

  // Fall back to comparing dates
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

  public printTasks(): void {
    const tasks = this.tasks.sort(taskCompare);

    tasks.forEach(task => {
      const rawTask = this.formatter.format(task);
      console.log(rawTask);
    });

    if (!tasks.length) {
      console.log(emoji.emojify("Go outside! :sunny:"));
    }
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
    this.tasks.forEach((task, index) => {
      if (task.identifier === identifier) {
        return index;
      }
    });

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
    let { identifier, size, description, date, complete } = task;
    date = moment(date).format();
    return `${identifier},${size},${description},${date},${complete}`;
  }

  private validateRawTask(rawTask) {
    const [identifier, rawSize, description, rawDate] = rawTask.split(",");
    return identifier && rawSize && description && rawDate;
  }

  private convertRawTask(rawTask: string): Task {
    const [
      rawIdentifier,
      rawSize,
      description,
      rawDate,
      rawComplete
    ] = rawTask.split(",");

    const size: TaskSize = TaskSize[rawSize];
    const date: Date = moment(rawDate);
    const complete: boolean = rawComplete == "true";
    const identifier: number = parseInt(rawIdentifier, 10);

    return { identifier, size, description, date, complete } as Task;
  }
}

yargs
  .usage("Usage: todo [command] [options]")
  .command("", "Add a new task or list all tasks")
  .command("complete", "Complete a task", function() {
    const identifier = yargs.argv._[1];
    if (!isInteger(identifier)) {
      console.log("Please provide a valid task ID.");
      process.exit(1);
    }

    const taskList = new TaskList("/coding/todo/.tasks");
    taskList.complete(identifier);
    process.exit(0);
  })
  .command("bump", "Upgrade a task size", function() {
    console.log("TODO: Implement this.");
    process.exit(0);
  })
  .command("nuke", "Clear all tasks", function() {
    if (FileStorage.exists(TASKS_FILE)) {
      FileStorage.destroy(TASKS_FILE);
    }
    process.exit(0);
  })
  .command("seed", "Seed some example tasks", function() {
    if (FileStorage.exists(TASKS_FILE)) {
      FileStorage.destroy(TASKS_FILE);
    }
    const taskList = new TaskList("/coding/todo/.tasks");
    SEED_TASKS.forEach(task => taskList.add(task));
    process.exit(0);
  })
  .help();

// TODO: Find a better place to put these functions
function isInteger(value: any): boolean {
  return value && typeof value === "number";
}

function getTaskSize(argv: ARGV): TaskSize {
  switch (argv.size) {
    case "large":
      return TaskSize.Large;
    case "medium":
      return TaskSize.Medium;
    case "small":
    default:
      return TaskSize.Small;
  }
}

function getDescription(argv: ARGV): string {
  const description = yargs.argv._.join(" ");

  // If there is no description provided, assume they meant ls
  if (!description.length) {
    new TaskList(TASKS_FILE).printTasks();
    process.exit(0);
  }

  return description;
}

function generateRandomIdentifier(): number {
  // More like pseudo-random
  return Math.floor(Math.random() * 1000);
}

// The default behavior, add/list, requires no command
const task: Task = {
  size: getTaskSize(yargs.argv),
  date: moment(),
  description: getDescription(yargs.argv),
  complete: false,
  identifier: generateRandomIdentifier()
};

new TaskList("/coding/todo/.tasks").add(task);
