import Ember from 'ember';
import mapboxgl from 'mapbox-gl';
import { computed } from 'ember-decorators/object'; // eslint-disable-line

import layerGroups from '../layer-groups';

import highlightedLotLayer from '../layers/highlighted-lot';
import selectedLayers from '../layers/selected-lot';

const selectedFillLayer = selectedLayers.fill;
const selectedLineLayer = selectedLayers.line;

const { later } = Ember.run;
const { service } = Ember.inject;
const {
  getOwner
} = Ember;

export default Ember.Component.extend({
  mainMap: service(),
  mapMouseover: service(),

  classNames: ['map-container'],

  lat: 40.7071266,
  lng: -74,
  zoom: 10.2,
  menuTo: 'layers-menu',

  layerGroups,

  mapConfig: Object.keys(layerGroups).map(key => layerGroups[key]),

  loading: true,

  debouncedDidResize(width) {
    this.set('width', width);
    this.updateChart();
  },

  @computed('mainMap.selected')
  fitBoundsOptions(selected) {
    if (selected) {
      const type = selected._internalModel.modelName;
      const el = this.$();
      const height = el.height();
      const width = el.width();

      const fullWidth = $('.navigation-area').width();
      console.log(fullWidth)
      const contentWidth = (fullWidth / 12) * 5
      console.log('mapwidth', width, contentWidth);

      const offset = -((width - contentWidth) / 2);

      const padding = Math.min(height, width) / 2.5;
      return {
        padding: selected && (type !== 'zoning-district') ? padding : 0,
        offset: [offset, 0],
      };
    }
    return null;
  },

  highlightedLotFeatures: [],

  @computed('highlightedLotFeatures')
  highlightedLotSource(features) {
    return {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features,
      },
    };
  },
  highlightedLotLayer,

  @computed('mainMap.selected')
  selectedLotSource(selected) {
    return {
      type: 'geojson',
      data: selected.get('geometry'),
    };
  },
  selectedFillLayer,
  selectedLineLayer,

  // didRender() {
  //   const map = this.get('mainMap').mapInstance;
  //   const bounds = this.get('mainMap').bounds;
  //   const route =  getOwner(this).lookup('controller:application').currentPath;
  //   console.log(route, bounds)
  //   if (route === 'lot') {
  //     console.log('calling fitbounds')
  //     map.fitBounds(bounds);
  //   }
  // },

  actions: {
    handleMapLoad(map) {
      const mainMap = this.get('mainMap');
      mainMap.set('mapInstance', map);
      map.addControl(new mapboxgl.NavigationControl(), 'top-left');
      map.addControl(new mapboxgl.ScaleControl({ unit: 'imperial' }), 'bottom-right');
      map.moveLayer('building');
      later(() => {
        if (map) {
          map.setPaintProperty('building', 'fill-opacity', 0.4);
        }
      }, 1000);
    },

    handleMouseover(e) {
      const mapMouseover = this.get('mapMouseover');
      mapMouseover.highlighter(e);
    },

    handleMouseleave() {
      const mapMouseover = this.get('mapMouseover');
      mapMouseover.set('highlightedLotFeatures', []);
      mapMouseover.set('currentEvent', null);
    },

    handleZoomend(event) {
      const mainMap = this.get('mainMap');
      mainMap.set('currentZoom', event.target.getZoom());
    },

    mapLoading(data) {
      const localConfig = this.get('mapConfig');
      const sourceIds = localConfig.mapBy('id');
      const localSource = localConfig.findBy('id', data.sourceId);

      if (localSource) {
        if (data.dataType === 'source' &&
            data.isSourceLoaded &&
            sourceIds.includes(data.sourceId)) {
          this.set('loading', false);
        } else {
          this.set('loading', true);
        }
      }
    },
  },
});
