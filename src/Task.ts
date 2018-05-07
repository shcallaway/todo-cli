const os = require("os");
const fs = require("fs");
const path = require("path");
const chalk = require("chalk");
const moment = require("moment");
const debug = require("debug")("Task");

export default class Task {
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
