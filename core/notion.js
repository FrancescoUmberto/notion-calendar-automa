require("dotenv").config();
const { Client } = require("@notionhq/client");
const Event = require("../Models/Event").Event;

class NotionUtils {
  constructor(calendar) {
    this.notion = new Client({ auth: process.env.NOTION_API_KEY });
    this.notion_database_id = calendar.calendar;
    this.lastChecked = new Date().toISOString();
    this.eventsList =
      calendar.events instanceof Map
        ? calendar.events
        : new Map(calendar.events);
    this.calendar = calendar;
  }

  async fetchEvents() {
    try {
      const response = await this.notion.databases.query({
        database_id: this.databaseId,
      });
      const events = response.results.map((page) => {
        return Event.fromNotionPage(page);
      });
      return events;
    } catch (error) {
      console.error("❌ Error fetching events from Notion:", error);
      return [];
    }
  }

  eventFilter(events, lastCheckedTruncated) {
    let newEvents = events.filter((event) => {
      return (
        event.last_edited_time >= lastCheckedTruncated &&
        !this.eventsList.has(event.id)
      );
    });

    newEvents.forEach((event) => {
      // set the state to pending
      event.state = "PENDING";
    });

    return newEvents;
  }

  async getNotionEvents() {
    try {
      const events = await this.fetchEvents();
      // Truncate the lastChecked timestamp to minutes for comparison
      const lastCheckedTruncated = Event.truncateToMinutes(
        new Date(this.lastChecked)
      );
      // TODO add also the possibility to edit an existing event

      // Filter new events: created after lastChecked and not already added
      const newEvents = this.eventFilter(events, lastCheckedTruncated);
      if (newEvents.length > 0) {
        console.log("New events: ", newEvents);
        newEvents.forEach((event) => {
          this.calendar.saveEvent(this.calendar, event);
        });
      }

      // Update the lastChecked timestamp
      this.lastChecked = new Date().toISOString();

      return newEvents;
    } catch (error) {
      console.error("❌ Error retrieving events from Notion:", error);
      return [];
    }
  }
}

module.exports = NotionUtils;
