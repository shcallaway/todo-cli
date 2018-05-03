const os = require("os");
const fs = require("fs");
const path = require("path");
const chalk = require("chalk");
const moment = require("moment");
const debug = require("debug")("debug");

import Task from "./Task";

export default class TaskFormatter {
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
