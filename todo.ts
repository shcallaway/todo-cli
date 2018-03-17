const fs = require("fs");
const yargs = require("yargs");
const path = require("path");
const chalk = require("chalk");
const moment = require("moment");

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
    complete: false
  },
  {
    size: TaskSize.Medium,
    description: "Example B",
    date: moment(),
    complete: false
  },
  {
    size: TaskSize.Small,
    description: "Example C",
    date: moment().subtract(20, "days"),
    complete: true
  },
  {
    size: TaskSize.Medium,
    description: "Example C",
    date: moment().subtract(21, "days"),
    complete: false
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
    let { size, description, date, complete } = task;

    const dateFormatter = new DateFormatter();
    const taskSizeFormatter = new TaskSizeFormatter();

    (date as any) = dateFormatter.format(date);
    (size as any) = taskSizeFormatter.format(size);

    description = this.formatDescription(description);
    const result = `${date}${size}${description}`;

    if (complete) {
      return chalk.dim(result);
    }

    return result;
  }

  private formatDescription(description: string): string {
    return chalk.italic(description);
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
    this.tasks = this.getTasksFromFileStorage();
    this.formatter = new TaskFormatter();
  }

  public printTasks(): void {
    const tasks = this.tasks.sort(taskCompare);

    tasks.forEach(task => {
      const rawTask = this.formatter.format(task);
      console.log(rawTask);
    });

    if (!tasks.length) {
      console.log("There's nothing here!");
    }
  }

  public addNewTask(task: Task): void {
    FileStorage.append(this.path, this.formatTaskAsRaw(task));
    this.tasks.push(task);
    console.log(this.formatter.format(task));
  }

  private getTasksFromFileStorage(): Array<Task> {
    if (!FileStorage.exists(this.path)) {
      return [] as Array<Task>;
    }

    return FileStorage.read(this.path)
      .split("\n")
      .filter(rawTask => this.validateRawTask(rawTask))
      .map(rawTask => this.convertRawTask(rawTask));
  }

  // TODO: Create a class for CSV string to object conversion
  // and remove notion of "raw" from TaskList

  private formatTaskAsRaw(task: Task): string {
    let { size, description, date, complete } = task;
    date = moment(date).format();
    return `${size},${description},${date},${complete}`;
  }

  private validateRawTask(rawTask) {
    const [rawSize, description, rawDate] = rawTask.split(",");
    return rawSize && description && rawDate;
  }

  private convertRawTask(rawTask: string): Task {
    const [rawSize, description, rawDate, rawComplete] = rawTask.split(",");

    const size: TaskSize = TaskSize[rawSize];
    const date: Date = moment(rawDate);
    const complete: boolean = rawComplete == "true";

    return { size, description, date, complete } as Task;
  }
}

yargs
  .usage("Usage: todo [command] [options]")
  .command("", "Add a new task")
  .command("ls", "List tasks", function() {
    new TaskList(TASKS_FILE).printTasks();
    process.exit(0);
  })
  .command("complete", "Complete a task", function() {
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
    SEED_TASKS.forEach(task => taskList.addNewTask(task));
    process.exit(0);
  })
  .option("size", {
    alias: "s",
    describe: "Set the size of the new task",
    choices: ["large", "medium", "small"],
    default: "small",
    type: "string"
  })
  .help();

// The default behavior, add, requires no command

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

  if (!description.length) {
    console.log("Please provide a task description.");
    process.exit(0);
  }

  return description;
}

const task: Task = {
  size: getTaskSize(yargs.argv),
  date: moment(),
  description: getDescription(yargs.argv),
  complete: false
};

new TaskList("/coding/todo/.tasks").addNewTask(task);
