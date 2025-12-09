// app/index.tsx

import "../firebase/firebaseConfig";
import { Redirect } from "expo-router";

export default function Index() {
  return <Redirect href="/" />;
}
