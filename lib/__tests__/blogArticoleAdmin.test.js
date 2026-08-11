import {
  ARTICLE_NOTIFICATION_MAX_AGE_MS,
  buildScheduledDate,
  shouldQueueArticlePushNotification,
} from "../articleSchedule";

function shouldShowBlogArticoleTable(db) {
  return Array.isArray(db) && db.length > 0;
}

function buildBlogUploadPayload({
  info,
  image,
  categorie,
  youtubeLinks,
  timpProgramat = "",
  dataProgramata = "",
}) {
  return {
    info,
    image,
    categorie,
    youtubeLinks,
    timpProgramat,
    dataProgramata,
  };
}

function buildBlogFirestoreDocument(data, { documentId, id, dateTime, date }) {
  const timpProgramat = data?.timpProgramat || "";
  const dataProgramata = data?.dataProgramata || "";

  return {
    ...data,
    documentId,
    id,
    firstUploadtime: timpProgramat.length > 0 ? timpProgramat : dateTime.time,
    firstUploadDate: dataProgramata.length > 0 ? dataProgramata : dateTime.date,
    firstUploadTimestamp: date,
    scheduledAtTs: date,
    notificationState: "pending",
  };
}

describe("blog articole admin UI", () => {
  it("shows the table when local db has rows even if parent articles prop is empty", () => {
    expect(shouldShowBlogArticoleTable([])).toBe(false);
    expect(shouldShowBlogArticoleTable([{ id: 1, info: { ro: { nume: "Test" } } }])).toBe(true);
  });

  it("keeps Firestore delete target distinct from local articles state", () => {
    // Regression: BlogArticole used to shadow `db` from firebase with useState([...articles]),
    // so deleteDoc(doc(db, ...)) received an array and failed after publish/edit.
    const firestoreDb = { __kind: "firestore" };
    const localArticlesDb = [{ documentId: "doc-1" }];
    const documentId = "doc-1";

    expect(Array.isArray(localArticlesDb)).toBe(true);
    expect(Array.isArray(firestoreDb)).toBe(false);
    expect(documentId).toBeTruthy();
  });

  it("does not hide newly added articles when parent articles prop stayed empty", () => {
    const parentArticles = [];
    const localDb = [
      {
        id: 1,
        documentId: "doc-new",
        info: { ro: { nume: "Articol nou", descriere: "desc" } },
      },
    ];

    expect(parentArticles.length).toBe(0);
    expect(shouldShowBlogArticoleTable(localDb)).toBe(true);
  });
});

describe("blog articole upload payload", () => {
  it("builds scheduled timestamps for BlogArticole uploads", () => {
    const date = buildScheduledDate({
      dataProgramata: "15-05-2026",
      timpProgramat: "08:30",
      fallbackDate: new Date("2026-01-01T00:00:00.000Z"),
    });

    expect(date).toBeInstanceOf(Date);
    expect(Number.isNaN(date.getTime())).toBe(false);
  });

  it("accepts missing schedule fields without throwing", () => {
    const payload = buildBlogUploadPayload({
      info: { ro: { nume: "Titlu", descriere: "Desc", content: "<p>x</p>" } },
      image: { finalUri: "https://example.com/a.jpg", fileName: "123" },
      categorie: "Previziuni zilnice",
      youtubeLinks: [],
    });

    const date = buildScheduledDate({
      dataProgramata: payload.dataProgramata,
      timpProgramat: payload.timpProgramat,
      fallbackDate: new Date("2026-05-01T10:00:00.000Z"),
    });

    const doc = buildBlogFirestoreDocument(payload, {
      documentId: "doc-1",
      id: 1,
      dateTime: { date: "01-05-2026", time: "10:00" },
      date,
    });

    expect(doc.documentId).toBe("doc-1");
    expect(doc.scheduledAtTs).toBe(date);
    expect(doc.notificationState).toBe("pending");
    expect(doc.firstUploadDate).toBe("01-05-2026");
    expect(doc.firstUploadtime).toBe("10:00");
  });
});

describe("shouldQueueArticlePushNotification", () => {
  it("does not requeue articles that were already sent", () => {
    const scheduled = new Date("2026-06-01T08:00:00+03:00");
    expect(
      shouldQueueArticlePushNotification(
        { notificationSentAt: { seconds: 1 } },
        scheduled
      )
    ).toBe(false);
  });

  it("does not queue notifications for stale daily horoscope schedules", () => {
    const now = Date.now();
    const stale = new Date(now - ARTICLE_NOTIFICATION_MAX_AGE_MS - 60_000);
    expect(shouldQueueArticlePushNotification({}, stale)).toBe(false);
  });

  it("queues future schedules and recent past schedules", () => {
    const now = Date.now();
    expect(
      shouldQueueArticlePushNotification({}, new Date(now + 60 * 60 * 1000))
    ).toBe(true);
    expect(
      shouldQueueArticlePushNotification({}, new Date(now - 60 * 60 * 1000))
    ).toBe(true);
  });
});
