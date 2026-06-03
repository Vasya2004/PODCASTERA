import { describe, expect, it } from "vitest";
import {
  extractVideoSource,
  extractVkVideoId,
  extractYouTubeVideoId,
  parseTimestampToSeconds,
  parseYouTubeDurationToSeconds,
} from "@/lib/youtube/utils";

describe("extractYouTubeVideoId", () => {
  it("supports youtube.com watch URLs", () => {
    expect(extractYouTubeVideoId("https://www.youtube.com/watch?v=dQw4w9WgXcQ")).toBe(
      "dQw4w9WgXcQ",
    );
  });

  it("supports youtu.be URLs", () => {
    expect(extractYouTubeVideoId("https://youtu.be/dQw4w9WgXcQ?t=12")).toBe(
      "dQw4w9WgXcQ",
    );
  });

  it("supports embed and shorts URLs", () => {
    expect(extractYouTubeVideoId("https://youtube.com/embed/dQw4w9WgXcQ")).toBe(
      "dQw4w9WgXcQ",
    );
    expect(extractYouTubeVideoId("https://youtube.com/shorts/dQw4w9WgXcQ")).toBe(
      "dQw4w9WgXcQ",
    );
  });

  it("rejects invalid URLs", () => {
    expect(extractYouTubeVideoId("https://example.com/watch?v=dQw4w9WgXcQ")).toBeNull();
    expect(extractYouTubeVideoId("not a url")).toBeNull();
  });
});

describe("extractVkVideoId", () => {
  it("supports vk.com and vkvideo.ru video URLs", () => {
    expect(extractVkVideoId("https://vk.com/video-12345_456239017")).toBe(
      "-12345_456239017",
    );
    expect(extractVkVideoId("https://vkvideo.ru/video12345_456239017")).toBe(
      "12345_456239017",
    );
  });

  it("supports VK video_ext URLs and nested z params", () => {
    expect(
      extractVkVideoId("https://vk.com/video_ext.php?oid=-12345&id=456239017&hash=abc"),
    ).toBe("-12345_456239017");
    expect(
      extractVkVideoId(
        "https://vk.com/video/@channel?z=video-12345_456239017%2Fclub12345",
      ),
    ).toBe("-12345_456239017");
  });
});

describe("extractVideoSource", () => {
  it("detects YouTube and VK providers", () => {
    expect(extractVideoSource("https://youtu.be/dQw4w9WgXcQ")?.provider).toBe(
      "youtube",
    );
    expect(extractVideoSource("https://vk.com/video-12345_456239017")?.provider).toBe(
      "vk",
    );
  });
});

describe("parseYouTubeDurationToSeconds", () => {
  it("parses ISO 8601 durations", () => {
    expect(parseYouTubeDurationToSeconds("PT1H2M3S")).toBe(3723);
    expect(parseYouTubeDurationToSeconds("PT15M")).toBe(900);
    expect(parseYouTubeDurationToSeconds("PT45S")).toBe(45);
    expect(parseYouTubeDurationToSeconds("P1DT2H")).toBe(93600);
  });

  it("throws on invalid durations", () => {
    expect(() => parseYouTubeDurationToSeconds("1:23")).toThrow();
  });
});

describe("parseTimestampToSeconds", () => {
  it("supports seconds, mm:ss and hh:mm:ss", () => {
    expect(parseTimestampToSeconds("90")).toBe(90);
    expect(parseTimestampToSeconds("12:34")).toBe(754);
    expect(parseTimestampToSeconds("1:02:03")).toBe(3723);
  });
});
