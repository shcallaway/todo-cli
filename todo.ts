const fs = require("fs");
const yargs = require("yargs");
const path = require("path");
const chalk = require("chalk");

const TASKS_FILE = "/coding/todo/.tasks";

// class CommandLineInterface {
//   public static printTasks(): void {
//     new TaskList("/coding/todo/.tasks").printTasks();
//   }

//   public static clearTasks(): void {
//     console.log("TODO: Implement this.");
//   }

//   public static addNewTask(): void {
//     console.log("argv._ = " + argv._);
//     const task: Task = {
//       size: TaskSize.Small,
//       description: argv._,
//       datetime: new Date()
//     };
//     new TaskList("/coding/todo/.tasks").addNewTask(task);
//   }
// }

enum TaskSize {
  Small = "Small",
  Medium = "Medium",
  Large = "Large"
}

interface Task {
  size: TaskSize;
  description: string;
  datetime: Date;
}

class FileSystem {
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

class TaskList {
  private tasks: Array<Task>;
  private path: string;

  constructor(path: string) {
    this.path = path;

    this.tasks = this.getTasksFromFileSystem();
  }

  public printTasks(): void {
    const rawTasks = this.tasks.map(task => this.formatTaskAsPretty(task));
    rawTasks.forEach(rawTask => console.log(rawTask));

    if (!rawTasks.length) {
      console.log("There's nothing here.");
    }
  }

  public addNewTask(task: Task): void {
    FileSystem.append(this.path, this.formatTaskAsRaw(task));
    this.tasks.push(task);
    console.log(this.formatTaskAsPretty(task));
  }

  private getTasksFromFileSystem(): Array<Task> {
    if (!FileSystem.exists(this.path)) {
      return [] as Array<Task>;
    }

    return FileSystem.read(this.path)
      .split("\n")
      .filter(rawTask => this.validateRawTask(rawTask))
      .map(rawTask => this.convertRawTask(rawTask));
  }

  private formatTaskAsPretty(task: Task): string {
    let { size, description, datetime } = task;

    (datetime as any) = this.formatDate(datetime);
    (size as string) = this.formatTaskSize(size);
    description = this.formatDescription(description);

    return `${datetime} | ${size} | ${description}`;
  }

  private formatDate(datetime: Date): string {
    // TODO: Make dates different colors based on how old they are
    (datetime as any) = datetime.toLocaleDateString("en-US");
    return chalk.black.bgGreen(datetime);
    // return chalk.bgRed(taskSize);
    // return chalk.bgYellow(taskSize);
  }

  private formatDescription(description: string): string {
    return chalk.italic(description);
  }

  private formatTaskSize(taskSize: TaskSize): string {
    return chalk.bold(taskSize as string);
  }

  private formatTaskAsRaw(task: Task): string {
    const { size, description, datetime } = task;
    return `${size},${description},${datetime}`;
  }

  private validateRawTask(rawTask) {
    const [rawSize, description, rawDate] = rawTask.split(",");
    return rawSize && description && rawDate;
  }

  private convertRawTask(rawTask: string): Task {
    const [rawSize, description, rawDate] = rawTask.split(",");

    const size: TaskSize = TaskSize[rawSize];
    const datetime: Date = new Date(rawDate);

    return { size, description, datetime } as Task;
  }
}

yargs
  .usage("Usage: todo [command] [options]")
  .command("ls", "List todos", function() {
    new TaskList(TASKS_FILE).printTasks();
    process.exit(0);
  })
  .command("nuke", "Clear all todos", function() {
    FileSystem.destroy(TASKS_FILE);
    process.exit(0);
  })
  .option("large", {
    alias: "l",
    describe: "Set the size of the new task to 'large'",
    demandOption: false,
    type: "boolean"
  })
  .option("medium", {
    alias: "m",
    describe: "Set the size of the new task to 'medium'",
    demandOption: false,
    type: "boolean"
  })
  .option("small", {
    alias: "s",
    describe: "Set the size of the new task to 'small'",
    demandOption: false,
    type: "boolean"
  })
  .help();

const argv = yargs.argv;

// For testing purposes...
if (FileSystem.exists(this.path)) {
  console.log("Clearing...");
  FileSystem.destroy("/coding/todo/.tasks");
}

const taskList = new TaskList("/coding/todo/.tasks");

// console.log("Seeding...");
// const seedTasks = [
//   { size: TaskSize.Large, description: "Hello world 1", datetime: new Date() },
//   { size: TaskSize.Medium, description: "Hello world 2", datetime: new Date() },
//   { size: TaskSize.Small, description: "Hello world 3", datetime: new Date() }
// ];

// seedTasks.forEach(task => {
//   taskList.addNewTask(task);
// });

const task: Task = {
  size: TaskSize.Small,
  datetime: new Date(),
  description: argv._.join(" ")
};

taskList.addNewTask(task);
