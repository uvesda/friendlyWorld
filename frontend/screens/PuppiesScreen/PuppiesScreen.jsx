import { View } from "react-native";
import { H1, P } from "@components/Typography/Typography";
import { Loader } from "@components/Loader/Loader";
import { useQuery } from "@hooks/useQuery";
import { puppiesApi } from "@entities/puppies/puppiesApi";

export default function PuppiesScreen() {
  const { data, loading } = useQuery(() => puppiesApi.getCount(), []);
  console.log(data?.data.length)
  if (loading) return <Loader />;

  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
      <H1>Щенки</H1>
      <P>Количество щенков: {data?.data.length}</P>
    </View>
  );
}