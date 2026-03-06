import { Image, ImageBackground, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Ionicons } from '@expo/vector-icons';

const topLocations = ['Sepang', 'Puchong', 'Bangsar', 'Cyberjaya', 'Kuala Lumpur'];

const images = {
  hero: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=1200&q=80',
  promo: 'https://images.unsplash.com/photo-1600585154084-4e5fe7c39198?auto=format&fit=crop&w=900&q=80',
  featured: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80',
  thumbA: 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?auto=format&fit=crop&w=600&q=80',
  thumbB: 'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?auto=format&fit=crop&w=600&q=80',
  thumbC: 'https://images.unsplash.com/photo-1600573472550-8090b5e0745e?auto=format&fit=crop&w=600&q=80',
};

const sampleProperties = [
  {
    id: '1',
    title: 'Evergreen @ Garden Residence',
    location: 'Persiaran Garden Residence 2, Cyberjaya, Selangor',
    price: 'RM 4,300 /mo',
    type: 'Semi-D',
    rating: '4.5',
    image: images.thumbA,
  },
  {
    id: '2',
    title: 'Myra Cove',
    location: 'Myra Cove, Cyberjaya, Selangor',
    price: 'RM 1,200 / month',
    type: 'Condo',
    rating: '4.6',
    image: images.thumbB,
  },
  {
    id: '3',
    title: 'Serene Villa @ Puchong',
    location: 'Puchong Perdana, Selangor',
    price: 'RM 3,900 /mo',
    type: 'Terrace',
    rating: '4.4',
    image: images.thumbC,
  },
];

const featuredProperties = sampleProperties.map((propertyItem) => ({
  ...propertyItem,
  badgeA: 'For Rent',
  badgeB: propertyItem.type,
}));

function PropertyRow({ item }: { item: (typeof sampleProperties)[number] }) {
  return (
    <View style={styles.propertyRow}>
      <Image source={{ uri: item.image }} style={styles.thumbnail} />
      <View style={styles.propertyBody}>
        <View style={styles.propertyTitleRow}>
          <Text numberOfLines={1} style={styles.propertyTitle}>
            {item.title}
          </Text>
          <Ionicons color="rgba(105, 65, 198, 0.42)" name="heart-outline" size={20} />
        </View>

        <View style={styles.propertyLocationRow}>
          <Ionicons color="#9DA4AE" name="location-outline" size={14} />
          <Text numberOfLines={1} style={styles.propertyLocation}>
            {item.location}
          </Text>
        </View>

        <View style={styles.priceRow}>
          <Text style={styles.propertyPrice}>{item.price}</Text>
          <Text style={styles.propertyType}>{item.type}</Text>
        </View>

        <View style={styles.metaRow}>
          <View style={styles.ratingPill}>
            <Ionicons color="#f59e0b" name="star" size={12} />
            <Text style={styles.ratingText}>{item.rating}</Text>
          </View>
          <View style={styles.metaPair}>
            <Ionicons color="#707680" name="bed-outline" size={13} />
            <Text style={styles.metaText}>3</Text>
          </View>
          <View style={styles.metaDivider} />
          <View style={styles.metaPair}>
            <Ionicons color="#707680" name="water-outline" size={13} />
            <Text style={styles.metaText}>2</Text>
          </View>
          <View style={styles.metaDivider} />
          <View style={styles.metaPair}>
            <Ionicons color="#707680" name="home-outline" size={13} />
            <Text style={styles.metaText}>3 Unit</Text>
          </View>
          <View style={styles.metaDivider} />
          <View style={styles.metaPair}>
            <Ionicons color="#707680" name="resize-outline" size={13} />
            <Text style={styles.metaText}>1,000 sqft</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

export function RealEstateHomeScreen() {
  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <ScrollView showsVerticalScrollIndicator={false} style={styles.container}>
        <ImageBackground source={{ uri: images.hero }} style={styles.headerCard}>
          <View style={styles.headerOverlay} />
          <View style={styles.locationRow}>
            <Text style={styles.locationLabel}>Location</Text>
            <Ionicons color="#8b5cf6" name="chevron-down" size={14} />
          </View>
          <View style={styles.locationValueRow}>
            <Ionicons color="#9333ea" name="location" size={18} />
            <Text style={styles.locationValue}>Cyberjaya, Selangor</Text>
            <View style={styles.iconCircle}>
              <Ionicons color="#111827" name="notifications-outline" size={18} />
            </View>
            <View style={styles.iconCircle}>
              <Ionicons color="#111827" name="chatbubble-ellipses-outline" size={18} />
            </View>
          </View>

          <View style={styles.searchBox}>
            <Ionicons color="#7c3aed" name="search-outline" size={20} />
            <Text style={styles.searchText}>Search Property</Text>
            <Ionicons color="#7c3aed" name="options-outline" size={20} />
          </View>

          <View style={styles.promoCard}>
            <View>
              <Text style={styles.promoTitle}>Beli Rumah</Text>
              <Text style={styles.promoSubtitle}>Trusted Platform</Text>
              <Text style={styles.promoUrl}>www.lamaniaga.com</Text>
            </View>
            <Image source={{ uri: images.promo }} style={styles.promoImage} />
          </View>
        </ImageBackground>

        <ScrollView
          contentContainerStyle={styles.featuredCarouselContent}
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.featuredCarousel}
        >
          {featuredProperties.map((item) => (
            <View key={`featured-${item.id}`} style={styles.featuredCard}>
              <ImageBackground source={{ uri: item.image ?? images.featured }} style={styles.featuredImage}>
                <View style={styles.featuredPillsRow}>
                  <View style={styles.featuredPill}>
                    <Text style={styles.featuredPillText}>{item.badgeA}</Text>
                  </View>
                  <View style={styles.featuredPill}>
                    <Text style={styles.featuredPillText}>{item.badgeB}</Text>
                  </View>
                </View>

                <View style={styles.featuredHeartButton}>
                  <Ionicons color="#E8ECE6" name="heart" size={14} />
                </View>
              </ImageBackground>
              <View style={styles.featuredBody}>
                <Text style={styles.featuredTitle}>{item.title}</Text>
                <Text style={styles.featuredLocation}>{item.location}</Text>
                <View style={styles.featuredBottomRow}>
                  <Text style={styles.featuredPrice}>{item.price}</Text>
                  <View style={styles.featuredArrowButton}>
                    <Ionicons color="#ffffff" name="arrow-forward" size={14} />
                  </View>
                </View>
              </View>
            </View>
          ))}
        </ScrollView>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Top Locations</Text>
          <Text style={styles.sectionAction}>See all</Text>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsRow}>
          {topLocations.map((locationItem, index) => (
            <View key={locationItem} style={[styles.chip, index === 1 && styles.chipActive]}>
              <Text style={[styles.chipText, index === 1 && styles.chipTextActive]}>{locationItem}</Text>
            </View>
          ))}
        </ScrollView>

        <View style={styles.listBlock}>
          {sampleProperties.slice(0, 2).map((item) => (
            <PropertyRow item={item} key={item.id} />
          ))}
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Nearby</Text>
          <Text style={styles.sectionAction}>15 Kilometer</Text>
        </View>

        <View style={styles.listBlock}>
          {sampleProperties.slice(1, 3).map((item) => (
            <PropertyRow item={item} key={item.id} />
          ))}
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Property For Sale</Text>
          <Text style={styles.sectionAction}>See all</Text>
        </View>

        <View style={[styles.listBlockWhite, styles.lastBlock]}>
          {sampleProperties.map((item) => (
            <PropertyRow item={item} key={`sale-${item.id}`} />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  container: {
    flex: 1,
  },
  headerCard: {
    backgroundColor: '#bae6fd',
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 16,
    minHeight: 260,
    justifyContent: 'flex-end',
  },
  headerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.62)',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    zIndex: 2,
  },
  locationLabel: {
    color: '#f3f4f6',
    fontSize: 12,
    fontWeight: '500',
    fontFamily: 'Inter_500Medium',
  },
  locationValueRow: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    zIndex: 2,
  },
  locationValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2A37',
    flex: 1,
    fontFamily: 'Inter_600SemiBold',
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 33,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.5)',
    borderWidth: 1,
    borderColor: '#D2D6DB',
  },
  searchBox: {
    marginTop: 14,
    height: 52,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.82)',
    paddingHorizontal: 16,
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    zIndex: 2,
    borderWidth: 1,
    borderColor: '#D2D6DB',
  },
  searchText: {
    fontSize: 14,
    color: '#000000',
    flex: 1,
    fontFamily: 'Inter_400Regular',
  },
  promoCard: {
    marginTop: 14,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 2,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 7.6,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  promoTitle: {
    fontSize: 25,
    fontWeight: '600',
    color: '#474648',
    fontFamily: 'Inter_600SemiBold',
  },
  promoSubtitle: {
    fontSize: 16,
    color: '#474648',
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
  },
  promoUrl: {
    fontSize: 12,
    color: '#747474',
    marginTop: 4,
    fontFamily: 'Inter_500Medium',
  },
  promoImage: {
    width: 112,
    height: 110,
    borderRadius: 10,
  },
  featuredCarousel: {
    marginTop: 14,
  },
  featuredCarouselContent: {
    paddingHorizontal: 15,
    gap: 24,
  },
  featuredCard: {
    width: 306,
    borderRadius: 16,
    backgroundColor: '#fff',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  featuredImage: {
    height: 183,
    justifyContent: 'flex-start',
    padding: 12,
  },
  featuredPillsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  featuredPill: {
    backgroundColor: 'rgba(109,109,109,0.74)',
    borderRadius: 9,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  featuredPillText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '400',
    fontFamily: 'Inter_400Regular',
  },
  featuredHeartButton: {
    width: 24,
    height: 24,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(178, 206, 227, 0.88)',
    position: 'absolute',
    right: 10,
    top: 10,
  },
  featuredBody: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 12,
  },
  featuredTitle: {
    fontSize: 21,
    fontWeight: '600',
    color: '#000000',
    fontFamily: 'Inter_600SemiBold',
  },
  featuredLocation: {
    marginTop: 3,
    fontSize: 12,
    color: '#8E8E93',
    fontFamily: 'Inter_400Regular',
  },
  featuredBottomRow: {
    marginTop: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  featuredPrice: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2A37',
    fontFamily: 'Roboto_500Medium',
  },
  featuredArrowButton: {
    width: 29,
    height: 29,
    borderRadius: 29,
    backgroundColor: '#923DE1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionHeader: {
    marginTop: 18,
    marginHorizontal: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2A37',
    fontFamily: 'Inter_600SemiBold',
  },
  sectionAction: {
    fontSize: 12,
    color: '#923DE1',
    fontWeight: '500',
    fontFamily: 'Inter_500Medium',
  },
  chipsRow: {
    marginTop: 10,
    paddingLeft: 15,
  },
  chip: {
    marginRight: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#D2D6DB',
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: '#F9F5FF',
  },
  chipActive: {
    backgroundColor: '#923DE1',
    borderColor: '#923DE1',
  },
  chipText: {
    color: '#9DA4AE',
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
  },
  chipTextActive: {
    color: '#ffffff',
  },
  listBlock: {
    marginTop: 10,
    backgroundColor: '#F6F6F6',
    paddingHorizontal: 15,
    paddingVertical: 15,
  },
  listBlockWhite: {
    marginTop: 10,
    backgroundColor: '#ffffff',
    paddingHorizontal: 15,
    paddingVertical: 0,
  },
  lastBlock: {
    marginBottom: 22,
  },
  propertyRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: '#E5E7EB',
    gap: 12,
  },
  thumbnail: {
    width: 80,
    height: 72,
    borderRadius: 6,
  },
  propertyBody: {
    flex: 1,
    gap: 4,
  },
  propertyTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  propertyLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  propertyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2A37',
    fontFamily: 'Roboto_500Medium',
    flex: 1,
  },
  propertyLocation: {
    fontSize: 10,
    color: '#9DA4AE',
    fontFamily: 'Inter_400Regular',
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
  },
  propertyPrice: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2A37',
    fontFamily: 'Roboto_500Medium',
  },
  propertyType: {
    fontSize: 14,
    color: 'rgba(60, 60, 67, 0.6)',
    fontWeight: '500',
    fontFamily: 'Roboto_500Medium',
  },
  metaRow: {
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  ratingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: '#FFFAEB',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  ratingText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#1F2A37',
    fontFamily: 'Inter_700Bold',
  },
  metaText: {
    fontSize: 11,
    color: '#707680',
    fontFamily: 'Roboto_500Medium',
  },
  metaPair: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaDivider: {
    width: 0.78,
    height: 13.63,
    backgroundColor: '#D9D9D9',
  },
});
