export interface Checkpoint {
  origin: string;
  entries: number;
  root_hash: string;
  signature: string;
  text: string;
}

export async function getCheckpoint(logUrl: string): Promise<Checkpoint> {
  const resp = await fetch(logUrl + "checkpoint");
  const text = await resp.text();
  const lines = text.split("\n");

  return {
    origin: lines[0],
    entries: parseInt(lines[1], 10),
    root_hash: lines[2],
    signature: lines[3].slice(2), // Removes the leading "— "
    text,
  };
}

function formatInteger(num: number): string {
  // Convert the number to a string and pad it to ensure it has at least 10 characters
  const p = num.toString(16).padStart(10, "0");

  // Split the padded string into chunks of 2 characters each
  const parts = [
    p.slice(0, 2),
    p.slice(2, 4),
    p.slice(4, 6),
    p.slice(6, 8),
    p.slice(8, 10),
  ];

  // Join the parts with slashes
  return parts.join("/");
}

export async function getLeaf(logUrl: string, index: number): Promise<string> {
  const resp = await fetch(
    logUrl + "seq/" + formatInteger(index)
  );
  return resp.text();
}
