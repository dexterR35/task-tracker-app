import React, { useState, useEffect, useMemo, useDeferredValue, useRef } from 'react';
import { createColumnHelper } from '@tanstack/react-table';
import TanStackTable from '@/components/Table/TanStackTable';
import SmallCard from '@/components/Card/smallCards/SmallCard';
import { Icons } from '@/components/icons';
import Badge from '@/components/ui/Badge/Badge';
import { CARD_SYSTEM } from '@/constants';
import Loader from '@/components/ui/Loader/Loader';
import { TextField } from '@/components/forms/components';
import SearchableSelectField from '@/components/forms/components/SearchableSelectField';
import landingPagesData from '@/constants/data.json';

const columnHelper = createColumnHelper();

// Create landing pages columns
const createLandingPagesColumns = () => [
  columnHelper.accessor('Brand', {
    header: 'BRAND',
    cell: ({ getValue }) => getValue() || '-',
    size: 120,
  }),
  columnHelper.accessor('Product', {
    header: 'PRODUCT',
    cell: ({ getValue }) => {
      const product = getValue();
      const productVariants = {
        Casino: 'crimson',
        Sport: 'green',
        Vegas: 'pink',
        Poker: 'purple',
        Lotto: 'yellow',
        Live: 'blue',
        'Sports + Casino': 'orange',
      };
      const variant = productVariants[product] || 'gray';
      return (
        <Badge variant={variant} size="sm">
          {product}
        </Badge>
        
      );
    },
    size: 120,
  }),
  columnHelper.accessor('Language', {
    header: 'LANGUAGE',
    cell: ({ getValue }) => getValue() || '-',
    size: 100,
  }),
  columnHelper.accessor('URL', {
    header: 'URL',
    cell: ({ getValue }) => {
      const url = getValue();
      if (!url || url === '#') return <span>N/A</span>;
      return (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="!text-blue-600  underline break-all text-xs"
        >
          {url}
        </a>
      );
    },
    size: 250,
  }),
  columnHelper.accessor('LP value', {
    header: 'LP VALUE',
    cell: ({ getValue }) => {
      const value = getValue();
      return (
        <Badge variant="amber" size="sm">
          {value || 'N/A'}
        </Badge>
      );
    },
    size: 150,
  }),
  columnHelper.accessor('Added', {
    header: 'ADDED',
    cell: ({ getValue }) => getValue() || '-',
    size: 100,
  }),
  columnHelper.accessor('End', {
    header: 'END',
    cell: ({ getValue }) => getValue() || '-',
    size: 100,
  }),
  columnHelper.accessor('Author', {
    header: 'AUTHOR',
    cell: ({ getValue }) => getValue() || '-',
    size: 120,
  }),
  columnHelper.accessor('Status', {
    header: 'STATUS',
    cell: ({ getValue }) => {
      const status = getValue();
      const variant = status === 'Enabled' ? 'green' : 'crimson';
      return (
        <Badge variant={variant} size="sm">
          {status || 'N/A'}
        </Badge>
      );
    },
    size: 100,
  }),
  columnHelper.accessor('Redirection', {
    header: 'REDIRECTION',
    cell: ({ getValue }) => {
      const redirection = getValue();
      if (!redirection || redirection === 'N/A') return <span>N/A</span>;
      return (
        <a
          href={redirection}
          target="_blank"
          rel="noopener noreferrer"
          className="!text-blue-600 underline break-all text-xs"
        >
          {redirection}
        </a>
      );
    },
    size: 250,
  }),
];

const LandingPages = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [jsonData, setJsonData] = useState([]);
  const [filters, setFilters] = useState({
    Brand: 'all',
    Product: 'all',
    Language: 'all',
    Status: 'all',
    Author: 'all',
    Search: '',
  });

  // Process and filter data on mount
  useEffect(() => {
    setIsLoading(true);
    
    setTimeout(() => {
      const processedData = landingPagesData
        .map((item, index) => {
          const brandRaw = item['Brand'] ? item['Brand'].replace(/"/g, '') : 'Unknown';
          const lpRaw = item['LP value'];
          const lpValue = typeof lpRaw === 'string' ? lpRaw : (lpRaw == null ? 'N/A' : String(lpRaw));
          const product = typeof item['Product'] === 'string' ? item['Product'] : (item['Product'] == null ? 'N/A' : String(item['Product']));
          const language = typeof item['Language'] === 'string' ? item['Language'] : (item['Language'] == null ? 'N/A' : String(item['Language']));
          const author = typeof item['Author'] === 'string' ? item['Author'] : (item['Author'] == null ? 'N/A' : String(item['Author']));
          const status = typeof item['Status'] === 'string' ? item['Status'] : (item['Status'] == null ? 'N/A' : String(item['Status']));
          const url = typeof item['URL'] === 'string' ? item['URL'] : (item['URL'] == null ? '#' : String(item['URL']));
          const redirection = typeof item['Redirection'] === 'string' ? item['Redirection'] : (item['Redirection'] == null ? 'N/A' : String(item['Redirection']));

          return ({
            id: `lp-${index}`,
            Brand: brandRaw,
            Product: product,
            Language: language,
            URL: url,
            'LP value': lpValue,
            // Precomputed lowercase values to avoid repeated toLowerCase in filters
            _brandLower: String(brandRaw).toLowerCase(),
            _lpValueLower: String(lpValue).toLowerCase(),
            Added: item['Added'] || 'N/A',
            End: item['End'] || 'N/A',
            Author: author,
            Status: status,
            Redirection: redirection,
          });
        })
        .filter((item) => item._brandLower.includes('netbet'));

      setJsonData(processedData);
      setIsLoading(false);
    }, 100);
  }, []);

  // Get unique values for select dropdowns
  const uniqueValues = useMemo(() => {
    return {
      Brand: Array.from(new Set(jsonData.map((item) => item.Brand))).sort(),
      Product: Array.from(new Set(jsonData.map((item) => item.Product))).sort(),
      Language: Array.from(new Set(jsonData.map((item) => item.Language))).sort(),
      Author: Array.from(new Set(jsonData.map((item) => item.Author))).sort(),
    };
  }, [jsonData]);

  // Defer search value to reduce re-renders while typing
  const deferredSearch = useDeferredValue(filters.Search);
  const deferredSearchLower = (deferredSearch || '').toLowerCase();

  // Filter data based on current filters
  const filteredData = useMemo(() => {
    return jsonData.filter((item) => {
      const matchesBrand = filters.Brand === 'all' || item.Brand === filters.Brand;
      const matchesProduct = filters.Product === 'all' || item.Product === filters.Product;
      const matchesLanguage = filters.Language === 'all' || item.Language === filters.Language;
      const matchesStatus = filters.Status === 'all' || item.Status === filters.Status;
      const matchesAuthor = filters.Author === 'all' || item.Author === filters.Author;
      const matchesSearch = deferredSearchLower === '' || item._lpValueLower.includes(deferredSearchLower);

      return (
        matchesBrand &&
        matchesProduct &&
        matchesLanguage &&
        matchesStatus &&
        matchesAuthor &&
        matchesSearch
      );
    });
  }, [jsonData, filters.Brand, filters.Product, filters.Language, filters.Status, filters.Author, deferredSearchLower]);

  // Global statistics (do NOT change with filters)
  const globalStats = useMemo(() => {
    let activeCount = 0;
    let expiredCount = 0;
    let sportCount = 0;
    let casinoCount = 0;

    jsonData.forEach((data) => {
      if (data['Status'] === 'Enabled') activeCount++;
      if (data['Status'] === 'Expired') expiredCount++;
      if (data['Product'] === 'Sport') sportCount++;
      if (data['Product'] === 'Casino') casinoCount++;
    });

    return {
      active: activeCount,
      expired: expiredCount,
      total: jsonData.length,
      sport: sportCount,
      casino: casinoCount,
    };
  }, [jsonData]);

  // Brand-specific statistics (change with current filters and brand selection)
  const brandStats = useMemo(() => {
    let brandActiveCount = 0;
    let brandExpiredCount = 0;
    let brandSportCount = 0;
    let brandCasinoCount = 0;
    const selectedBrand = filters.Brand;

    if (selectedBrand !== 'all') {
      filteredData.forEach((data) => {
        if (data['Brand'] === selectedBrand) {
          if (data['Status'] === 'Enabled') brandActiveCount++;
          if (data['Status'] === 'Expired') brandExpiredCount++;
          if (data['Product'] === 'Sport') brandSportCount++;
          if (data['Product'] === 'Casino') brandCasinoCount++;
        }
      });
    }

    return {
      name: selectedBrand === 'all' ? 'Brand' : selectedBrand,
      active: brandActiveCount,
      expired: brandExpiredCount,
      total: brandActiveCount + brandExpiredCount,
      sport: brandSportCount,
      casino: brandCasinoCount,
    };
  }, [filteredData, filters.Brand]);

  // Cache for stable card references (ID badge)
  const cardCacheRef = useRef(new Map());

  // Create statistics cards with stable references
  const statisticsCardsRaw = useMemo(() => [
    {
      id: 'total-active',
      title: 'Total Active',
      subtitle: 'NetBet LPs',
      value: globalStats.active,
      description: 'Currently enabled landing pages',
      color: 'green',
      icon: Icons.generic.check,
    },
    {
      id: 'total-expired',
      title: 'Total Expired',
      subtitle: 'NetBet LPs',
      value: globalStats.expired,
      description: 'Expired landing pages',
      color: 'crimson',
      icon: Icons.buttons.clear,
    },
    {
      id: 'total-all',
      title: 'Total LPs',
      subtitle: 'NetBet LPs',
      value: globalStats.total,
      description: 'All landing pages',
      color: 'blue',
      icon: Icons.generic.table,
    },
    {
      id: 'total-sport',
      title: 'Sport Total',
      subtitle: 'NetBet LPs',
      value: globalStats.sport,
      description: 'Sport product landing pages',
      color: 'purple',
      icon: Icons.generic.star,
    },
    {
      id: 'total-casino',
      title: 'Casino Total',
      subtitle: 'NetBet LPs',
      value: globalStats.casino,
      description: 'Casino product landing pages',
      color: 'orange',
      icon: Icons.generic.product,
    },
  ], [globalStats]);

  const statisticsCards = useMemo(() => {
    return statisticsCardsRaw.map(newCard => {
      const cacheKey = `${newCard.id}-${newCard.color}-${newCard.value}-${newCard.title}-${newCard.subtitle}-${JSON.stringify(newCard.details)}-${JSON.stringify(newCard.badge)}`;
      const cachedCard = cardCacheRef.current.get(cacheKey);
      
      if (cachedCard && 
          cachedCard.id === newCard.id &&
          cachedCard.color === newCard.color &&
          cachedCard.value === newCard.value &&
          cachedCard.title === newCard.title &&
          cachedCard.subtitle === newCard.subtitle &&
          JSON.stringify(cachedCard.details) === JSON.stringify(newCard.details) &&
          JSON.stringify(cachedCard.badge) === JSON.stringify(newCard.badge)) {
        return cachedCard;
      }
      
      cardCacheRef.current.set(cacheKey, newCard);
      return newCard;
    });
  }, [statisticsCardsRaw]);

  const brandStatisticsCardsRaw = useMemo(() => [
    {
      id: 'brand-active',
      title: 'Brand Active',
      subtitle: brandStats.name,
      value: brandStats.active,
      description: 'Enabled for selected brand',
      color: 'green',
      icon: Icons.generic.check,
    },
    {
      id: 'brand-expired',
      title: 'Brand Expired',
      subtitle: brandStats.name,
      value: brandStats.expired,
      description: 'Expired for selected brand',
      color: 'crimson',
      icon: Icons.buttons.clear,
    },
    {
      id: 'brand-total',
      title: 'Brand Total',
      subtitle: brandStats.name,
      value: brandStats.total,
      description: 'Total for selected brand',
      color: 'blue',
      icon: Icons.generic.table,
    },
    {
      id: 'brand-sport',
      title: 'Brand Sport',
      subtitle: brandStats.name,
      value: brandStats.sport,
      description: 'Sport for selected brand',
      color: 'purple',
      icon: Icons.generic.star,
    },
    {
      id: 'brand-casino',
      title: 'Brand Casino',
      subtitle: brandStats.name,
      value: brandStats.casino,
      description: 'Casino for selected brand',
      color: 'orange',
      icon: Icons.generic.product,
    },
  ], [brandStats]);

  const brandStatisticsCards = useMemo(() => {
    return brandStatisticsCardsRaw.map(newCard => {
      const cacheKey = `${newCard.id}-${newCard.color}-${newCard.value}-${newCard.title}-${newCard.subtitle}-${JSON.stringify(newCard.details)}-${JSON.stringify(newCard.badge)}`;
      const cachedCard = cardCacheRef.current.get(cacheKey);
      
      if (cachedCard && 
          cachedCard.id === newCard.id &&
          cachedCard.color === newCard.color &&
          cachedCard.value === newCard.value &&
          cachedCard.title === newCard.title &&
          cachedCard.subtitle === newCard.subtitle &&
          JSON.stringify(cachedCard.details) === JSON.stringify(newCard.details) &&
          JSON.stringify(cachedCard.badge) === JSON.stringify(newCard.badge)) {
        return cachedCard;
      }
      
      cardCacheRef.current.set(cacheKey, newCard);
      return newCard;
    });
  }, [brandStatisticsCardsRaw]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleSearchChange = (value) => {
    setFilters((prev) => ({ ...prev, Search: value }));
  };

  // Create register function for form fields
  const createRegister = (fieldName, onChangeHandler) => (name) => ({
    name,
    onChange: (e) => onChangeHandler(e.target.value),
    onBlur: () => {},
    ref: () => {},
  });

  // Memoize columns
  const columns = useMemo(() => createLandingPagesColumns(), []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex-center">
        <Loader size="lg" text="Loading landing pages data..." variant="spinner" />
      </div>
    );
  }

  return (
    <div>
      {/* Page Header */}
      <div className="mb-4">
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-xl font-bold">Landing Pages</h1>
            <p className="text-xs mt-0">
              @NetBet 2025  
            </p>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
          {statisticsCards.map((card) => (
            <SmallCard key={card.id} card={card} />
          ))}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {brandStatisticsCards.map((card) => (
            <SmallCard key={card.id} card={card} />
          ))}
        </div>
      </div>

      {/* Filters Section */}
      <div className="card mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <SearchableSelectField
            field={{
              name: 'brandSelect',
              label: 'Brand',
              type: 'select',
              required: false,
              placeholder: 'Select Brand',
              options: [
                { value: 'all', label: 'All' },
                ...uniqueValues.Brand.map((brand) => ({
                  value: brand,
                  label: brand,
                })),
              ],
            }}
            register={createRegister('brandSelect', (value) => handleFilterChange('Brand', value))}
            errors={{}}
            setValue={(name, value) => handleFilterChange('Brand', value)}
            watch={(name) => (name === 'brandSelect' ? filters.Brand : '')}
            trigger={() => {}}
            clearErrors={() => {}}
            formValues={{ brandSelect: filters.Brand }}
          />

          <SearchableSelectField
            field={{
              name: 'productSelect',
              label: 'Product',
              type: 'select',
              required: false,
              placeholder: 'Select Product',
              options: [
                { value: 'all', label: 'All' },
                ...uniqueValues.Product.map((product) => ({
                  value: product,
                  label: product,
                })),
              ],
            }}
            register={createRegister('productSelect', (value) => handleFilterChange('Product', value))}
            errors={{}}
            setValue={(name, value) => handleFilterChange('Product', value)}
            watch={(name) => (name === 'productSelect' ? filters.Product : '')}
            trigger={() => {}}
            clearErrors={() => {}}
            formValues={{ productSelect: filters.Product }}
          />

          <SearchableSelectField
            field={{
              name: 'languageSelect',
              label: 'Language',
              type: 'select',
              required: false,
              placeholder: 'Select Language',
              options: [
                { value: 'all', label: 'All' },
                ...uniqueValues.Language.map((language) => ({
                  value: language,
                  label: language,
                })),
              ],
            }}
            register={createRegister('languageSelect', (value) => handleFilterChange('Language', value))}
            errors={{}}
            setValue={(name, value) => handleFilterChange('Language', value)}
            watch={(name) => (name === 'languageSelect' ? filters.Language : '')}
            trigger={() => {}}
            clearErrors={() => {}}
            formValues={{ languageSelect: filters.Language }}
          />

          <SearchableSelectField
            field={{
              name: 'statusSelect',
              label: 'Status',
              type: 'select',
              required: false,
              placeholder: 'Select Status',
              options: [
                { value: 'all', label: 'All' },
                { value: 'Enabled', label: 'Enabled' },
                { value: 'Expired', label: 'Expired' },
              ],
            }}
            register={createRegister('statusSelect', (value) => handleFilterChange('Status', value))}
            errors={{}}
            setValue={(name, value) => handleFilterChange('Status', value)}
            watch={(name) => (name === 'statusSelect' ? filters.Status : '')}
            trigger={() => {}}
            clearErrors={() => {}}
            formValues={{ statusSelect: filters.Status }}
          />

          <SearchableSelectField
            field={{
              name: 'authorSelect',
              label: 'Author',
              type: 'select',
              required: false,
              placeholder: 'Select Author',
              options: [
                { value: 'all', label: 'All' },
                ...uniqueValues.Author.map((author) => ({
                  value: author,
                  label: author,
                })),
              ],
            }}
            register={createRegister('authorSelect', (value) => handleFilterChange('Author', value))}
            errors={{}}
            setValue={(name, value) => handleFilterChange('Author', value)}
            watch={(name) => (name === 'authorSelect' ? filters.Author : '')}
            trigger={() => {}}
            clearErrors={() => {}}
            formValues={{ authorSelect: filters.Author }}
          />

          <TextField
            field={{
              name: 'searchInput',
              label: 'Search',
              type: 'text',
              required: false,
              placeholder: 'by LP value',
            }}
            register={createRegister('searchInput', (value) => handleSearchChange(value))}
            errors={{}}
            setValue={(name, value) => handleSearchChange(value)}
            watch={(name) => (name === 'searchInput' ? filters.Search : '')}
            trigger={() => {}}
            clearErrors={() => {}}
            formValues={{ searchInput: filters.Search }}
          />
        </div>
      </div>

      {/* Table Section */}
      <div>
        <div className="py-6">
          <div className="flex items-center justify-between">
            <div>
              <h3>Landing Pages</h3>
              <p className="text-sm">
                Manage and track NetBet landing pages
              </p>
            </div>
          </div>
        </div>

        <div className="py-2">
          <TanStackTable
            data={filteredData}
            columns={columns}
            tableType="landing-pages"
            isLoading={false}
            showPagination={true}
            showFilters={false}
            showColumnToggle={true}
            enablePagination={true}
            enableSorting={true}
            enableFiltering={false}
            enableRowSelection={false}
          />
        </div>
      </div>
    </div>
  );
};

export default LandingPages;
