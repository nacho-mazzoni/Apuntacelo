import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabaseAdmin = getSupabaseAdmin();
  const { data, error } = await supabaseAdmin
    .from("requests")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function PATCH(req: Request) {
  const supabaseAdmin = getSupabaseAdmin();
  const body = await req.json();
  const { content_hash, requester, status } = body;

  if (!content_hash || !requester || status === undefined || status === null) {
    return NextResponse.json({ error: "Missing required fields: content_hash, requester, status" }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from("requests")
    .update({ status })
    .eq("content_hash", content_hash)
    .eq("requester", requester)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const supabaseAdmin = getSupabaseAdmin();
  const body = await req.json();
  const { content_hash, requester, title, description, reward, token } = body;

  if (!content_hash || !requester || !title || !reward || !token) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from("requests")
    .insert({
      content_hash,
      requester,
      title,
      description: description || "",
      reward,
      token,
      status: 0,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
