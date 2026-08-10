import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const rows = await db`select * from requests order by created_at desc`;
    return NextResponse.json(rows);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Database error" },
      { status: 500 },
    );
  }
}

export async function PATCH(req: Request) {
  const body = await req.json();
  const { id, status } = body;

  if (id === undefined || id === null || status === undefined || status === null) {
    return NextResponse.json(
      { error: "Missing required fields: id, status" },
      { status: 400 },
    );
  }

  try {
    const rows = await db`update requests set status = ${status} where id = ${id} returning *`;
    if (rows.length === 0) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }
    return NextResponse.json(rows[0]);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Database error" },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  const body = await req.json();
  const { id, content_hash, requester, title, description, reward, token } = body;

  if (!id || !content_hash || !requester || !title || !reward || !token) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  try {
    const rows = await db`
      insert into requests (id, content_hash, requester, title, description, reward, token, status)
      values (${id}, ${content_hash}, ${requester}, ${title}, ${description ?? ""}, ${reward}, ${token}, 0)
      returning *
    `;
    return NextResponse.json(rows[0]);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Database error" },
      { status: 500 },
    );
  }
}
