import React from "react";
import { FlatList, Text, TouchableOpacity, View } from "react-native";

interface BundleProduct {
  product_code: string;
  name: string;
  has_offer: boolean;
  base_price: number;
  final_price: number;
  bonus_data_mb: number;
}

interface BundleListProps {
  products: BundleProduct[];
  onSelect: (product: BundleProduct) => void;
}

export default function BundleList({
  products,
  onSelect,
}: BundleListProps) {
  return (
    <FlatList<BundleProduct>
      data={products}
      keyExtractor={(item) => item.product_code}
      renderItem={({ item }) => (
        <TouchableOpacity
          onPress={() => onSelect(item)}
          className="border p-4 rounded-xl mb-2"
        >
          <Text className="font-semibold">{item.name}</Text>

          <View className="flex-row gap-2 mt-1">
            {item.has_offer ? (
              <>
                <Text className="line-through text-gray-500">
                  ₦{item.base_price}
                </Text>
                <Text className="text-green-600 font-bold">
                  ₦{item.final_price}
                </Text>

                {item.bonus_data_mb > 0 && (
                  <Text className="text-orange-600">
                    + {item.bonus_data_mb}MB bonus
                  </Text>
                )}
              </>
            ) : (
              <Text className="font-bold">
                ₦{item.final_price}
              </Text>
            )}
          </View>
        </TouchableOpacity>
      )}
    />
  );
}
