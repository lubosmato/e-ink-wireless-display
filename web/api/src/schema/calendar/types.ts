import { builder } from "../../builder"

export type EventDateTime = {
  /**
   * The date, in the format "yyyy-mm-dd", if this is an all-day event.
   */
  date: string | null | undefined
  dateTime: string | null | undefined
}

export const getDate = ({ date, dateTime }: EventDateTime): Date | null => {
  if (dateTime) return new Date(dateTime)
  if (date) return new Date(date)

  return null
}

export type EventReminder = {
  /**
   * The method used by this reminder. Possible values are:
   * - "email" - Reminders are sent via email.
   * - "popup" - Reminders are sent via a UI popup.
   * Required when adding a reminder.
   */
  method: "email" | "popup"
  /**
   * Number of minutes before the start of the event when the reminder should trigger. Valid values are between 0 and 40320 (4 weeks in minutes).
   * Required when adding a reminder.
   */
  minutes: number
}

const AttendeeResponseStatuses = [
  "needsAction",
  "declined",
  "tentative",
  "accepted",
] as const

export type EventAttendee = {
  /**
   * The attendee's response comment. Optional.
   */
  comment: string | null
  /**
   * The attendee's name, if available. Optional.
   */
  displayName: string | null
  /**
   * The attendee's email address, if available. This field must be present when adding an attendee. It must be a valid email address as per RFC5322.
   * Required when adding an attendee.
   */
  email: string | null
  /**
   * The attendee's Profile ID, if available.
   */
  id: string | null
  /**
   * Whether this is an optional attendee. Optional. The default is False.
   */
  optional: boolean | null
  /**
   * Whether the attendee is the organizer of the event. Read-only. The default is False.
   */
  organizer: boolean | null
  /**
   * The attendee's response status. Possible values are:
   * - "needsAction" - The attendee has not responded to the invitation (recommended for new events).
   * - "declined" - The attendee has declined the invitation.
   * - "tentative" - The attendee has tentatively accepted the invitation.
   * - "accepted" - The attendee has accepted the invitation.  Warning: If you add an event using the values declined, tentative, or accepted, attendees with the "Add invitations to my calendar" setting set to "When I respond to invitation in email" won't see an event on their calendar unless they choose to change their invitation response in the event invitation email.
   */
  responseStatus: typeof AttendeeResponseStatuses[number]
  /**
   * Whether this entry represents the calendar on which this copy of the event appears. Read-only. The default is False.
   */
  self: boolean
}

export type CalendarEvent = {
  /**
   * The attendees of the event. See the Events with attendees guide for more information on scheduling events with other calendar users. Service accounts need to use domain-wide delegation of authority to populate the attendee list.
   */
  attendees: EventAttendee[] | null | undefined
  /**
   * The color of the event. This is an ID referring to an entry in the event section of the colors definition (see the  colors endpoint). Optional.
   */
  colorId: string | null
  /**
   * Creation time of the event (as a RFC3339 timestamp). Read-only.
   */
  created: Date | null | undefined
  /**
   * The creator of the event. Read-only.
   */
  creator:
    | {
        displayName: string | null
        email: string | null
        id: string | null
        self: boolean
      }
    | null
    | undefined
  /**
   * Description of the event. Can contain HTML. Optional.
   */
  description: string | null
  /**
   * The (exclusive) end time of the event. For a recurring event, this is the end time of the first instance.
   */
  end: EventDateTime
  /**
   * Whether the end time is actually unspecified. An end time is still provided for compatibility reasons, even if this attribute is set to True. The default is False.
   */
  endTimeUnspecified: boolean
  /**
   * Specific type of the event. Read-only. Possible values are:
   * - "default" - A regular event or not further specified.
   * - "outOfOffice" - An out-of-office event.
   * - "focusTime" - A focus-time event.
   */
  eventType: typeof EventTypes[number] | null | undefined
  /**
   * An absolute link to this event in the Google Calendar Web UI. Read-only.
   */
  htmlLink: string
  /**
   * Event unique identifier as defined in RFC5545. It is used to uniquely identify events accross calendaring systems and must be supplied when importing events via the import method.
   * Note that the iCalUID and the id are not identical and only one of them should be supplied at event creation time. One difference in their semantics is that in recurring events, all occurrences of one event have different ids while they all share the same iCalUIDs. To retrieve an event using its iCalUID, call the events.list method using the iCalUID parameter. To retrieve an event using its id, call the events.get method.
   */
  id: string
  /**
   * Geographic location of the event as free-form text. Optional.
   */
  location: string | null
  /**
   * The organizer of the event. If the organizer is also an attendee, this is indicated with a separate entry in attendees with the organizer field set to True. To change the organizer, use the move operation. Read-only, except when importing an event.
   */
  organizer: {
    displayName: string | null
    email: string | null
    id: string | null
    self: boolean
  }
  /**
   * Information about the event's reminders for the authenticated user.
   */
  reminders: {
    overrides: EventReminder[] | null // TODO why?
    useDefault: boolean
  }
  /**
   * The (inclusive) start time of the event. For a recurring event, this is the start time of the first instance.
   */
  start: EventDateTime
  /**
   * Status of the event. Optional. Possible values are:
   * - "confirmed" - The event is confirmed. This is the default status.
   * - "tentative" - The event is tentatively confirmed.
   * - "cancelled" - The event is cancelled (deleted). The list method returns cancelled events only on incremental sync (when syncToken or updatedMin are specified) or if the showDeleted flag is set to true. The get method always returns them.
   * A cancelled status represents two different states depending on the event type:
   * - Cancelled exceptions of an uncancelled recurring event indicate that this instance should no longer be presented to the user. Clients should store these events for the lifetime of the parent recurring event.
   * Cancelled exceptions are only guaranteed to have values for the id, recurringEventId and originalStartTime fields populated. The other fields might be empty.
   * - All other cancelled events represent deleted events. Clients should remove their locally synced copies. Such cancelled events will eventually disappear, so do not rely on them being available indefinitely.
   * Deleted events are only guaranteed to have the id field populated.   On the organizer's calendar, cancelled events continue to expose event details (summary, location, etc.) so that they can be restored (undeleted). Similarly, the events to which the user was invited and that they manually removed continue to provide details. However, incremental sync requests with showDeleted set to false will not return these details.
   * If an event changes its organizer (for example via the move operation) and the original organizer is not on the attendee list, it will leave behind a cancelled event where only the id field is guaranteed to be populated.
   */
  status: typeof EventStatuses[number]
  /**
   * Title of the event.
   */
  summary: string
  /**
   * Whether the event blocks time on the calendar. Optional. Possible values are:
   * - "opaque" - Default value. The event does block time on the calendar. This is equivalent to setting Show me as to Busy in the Calendar UI.
   * - "transparent" - The event does not block time on the calendar. This is equivalent to setting Show me as to Available in the Calendar UI.
   */
  transparency: typeof EventTransparencies[number] | null
  /**
   * Last modification time of the event (as a RFC3339 timestamp). Read-only.
   */
  updated: Date
  /**
   * Visibility of the event. Optional. Possible values are:
   * - "default" - Uses the default visibility for events on the calendar. This is the default value.
   * - "public" - The event is public and event details are visible to all readers of the calendar.
   * - "private" - The event is private and only event attendees may view event details.
   * - "confidential" - The event is private. This value is provided for compatibility reasons.
   */
  visibility: typeof EventVisibilities[number] | null
}

const PersonObject = builder
  .objectRef<NonNullable<CalendarEvent["creator"]>>("Person")
  .implement({
    fields: (t) => ({
      displayName: t.exposeString("displayName", { nullable: true }),
      email: t.exposeString("email", { nullable: true }),
      id: t.exposeString("id", { nullable: true }),
      self: t.field({ type: "Boolean", resolve: (p) => p?.self ?? false }),
    }),
  })

const EventTypes = ["default", "outOfOffice", "focusTime"] as const
const EventStatuses = ["confirmed", "tentative", "cancelled"] as const
const EventTransparencies = ["opaque", "transparent"] as const
const EventVisibilities = [
  "default",
  "public",
  "private",
  "confidential",
] as const

const ReminderObject = builder
  .objectRef<EventReminder>("EventReminder")
  .implement({
    fields: (t) => ({
      method: t.exposeString("method"),
      minutes: t.exposeFloat("minutes"),
    }),
  })

const RemindersObject = builder
  .objectRef<CalendarEvent["reminders"]>("EventReminders")
  .implement({
    fields: (t) => ({
      overrides: t.field({
        type: [ReminderObject],
        resolve: (e) => e.overrides ?? [],
      }),
      useDefault: t.exposeBoolean("useDefault"),
    }),
  })

const AttendeeResponseStatus = builder.enumType("AttendeeResponseStatus", {
  values: AttendeeResponseStatuses,
})

const EventAttendeeObject = builder
  .objectRef<EventAttendee>("EventAttendee")
  .implement({
    fields: (t) => ({
      displayName: t.exposeString("displayName", { nullable: true }),
      email: t.exposeString("email", { nullable: true }),
      optional: t.exposeBoolean("optional", { nullable: true }),
      organizer: t.exposeBoolean("organizer", { nullable: true }),
      responseStatus: t.field({
        type: AttendeeResponseStatus,
        resolve: (parent) => parent.responseStatus,
      }),
      self: t.field({ type: "Boolean", resolve: (p) => p.self ?? false }),
    }),
  })

const EventType = builder.enumType("EventType", {
  values: EventTypes,
})

const EventStatus = builder.enumType("EventStatus", {
  values: EventStatuses,
})

const EventTransparency = builder.enumType("EventTransparency", {
  values: EventTransparencies,
})

const EventVisibility = builder.enumType("EventVisibility", {
  values: EventVisibilities,
})

export const EventOject = builder.objectRef<CalendarEvent>("Event").implement({
  fields: (t) => ({
    id: t.exposeString("id"),
    summary: t.exposeString("summary", { nullable: true }),
    description: t.exposeString("description", { nullable: true }),
    eventType: t.expose("eventType", { type: EventType, nullable: true }),
    status: t.expose("status", { type: EventStatus }),
    attendees: t.field({
      type: [EventAttendeeObject],
      resolve: (e) => e.attendees ?? [],
    }),
    colorId: t.exposeString("colorId", { nullable: true }),
    created: t.expose("created", { type: "Date", nullable: true }),
    creator: t.expose("creator", { type: PersonObject, nullable: true }),
    end: t.field({
      type: "Date",
      resolve: (e) => getDate(e.end),
      nullable: true,
    }),
    htmlLink: t.exposeString("htmlLink"),
    location: t.exposeString("location", { nullable: true }),
    organizer: t.expose("organizer", { type: PersonObject, nullable: true }),
    reminders: t.expose("reminders", { type: RemindersObject }),
    start: t.field({
      type: "Date",
      resolve: (e) => getDate(e.start),
      nullable: true,
    }),
    updated: t.expose("updated", { type: "Date" }),
    transparency: t.field({
      type: EventTransparency,
      resolve: (e) => e.transparency ?? "opaque",
    }),
    visibility: t.field({
      type: EventVisibility,
      resolve: (e) => e.visibility ?? "default",
    }),
  }),
})
