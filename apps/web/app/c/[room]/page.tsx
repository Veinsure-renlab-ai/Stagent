import { RoomClient } from "./RoomClient"

interface PageProps {
  params: { room: string }
}

export default function RoomPage({ params }: PageProps) {
  return <RoomClient room={params.room} />
}

export function generateMetadata({ params }: PageProps) {
  return { title: `Stagent · ${params.room}` }
}
