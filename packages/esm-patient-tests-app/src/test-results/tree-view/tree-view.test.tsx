import React from 'react';
import { render, screen } from '@testing-library/react';
import { getDefaultsFromConfigSchema, useConfig, useLayoutType } from '@openmrs/esm-framework';
import { mockPatient } from 'tools';
import { mockGroupedResults, mockResults } from '__mocks__';
import { type ConfigObject, configSchema } from '../../config-schema';
import { type FilterContextProps } from '../filter/filter-types';
import { useGetManyObstreeData } from '../grouped-timeline';
import TreeView from './tree-view.component';
import FilterContext from '../filter/filter-context';

const mockUseConfig = jest.mocked(useConfig<ConfigObject>);
const mockUseLayoutType = jest.mocked(useLayoutType);
const mockUseGetManyObstreeData = jest.mocked(useGetManyObstreeData);

jest.mock('../panel-timeline/helpers', () => ({
  ...jest.requireActual('../panel-timeline/helpers'),
  parseTime: jest.fn(),
}));

jest.mock('../grouped-timeline', () => ({
  ...jest.requireActual('../grouped-timeline'),
  useGetManyObstreeData: jest.fn(),
}));

const mockProps = {
  patientUuid: mockPatient.id,
  patient: mockPatient,
  basePath: '/test-base-path',
  testUuid: 'test-uuid',
  expanded: false,
  type: 'default',
  view: 'individual-test' as const,
  isLoading: false,
};

const mockFilterContext: FilterContextProps = {
  activeTests: ['Bloodwork-Chemistry', 'Bloodwork'],
  timelineData: mockGroupedResults.timelineData,
  tableData: null,
  trendlineData: null,
  parents: mockGroupedResults.parents,
  checkboxes: { Bloodwork: false, Chemistry: true },
  someChecked: true,
  lowestParents: mockGroupedResults['lowestParents'],
  totalResultsCount: 0,
  initialize: jest.fn(),
  toggleVal: jest.fn(),
  updateParent: jest.fn(),
  resetTree: jest.fn(),
  roots: mockResults,
  tests: {},
};

const renderTreeViewWithMockContext = (contextValue = mockFilterContext) => {
  render(
    <FilterContext.Provider value={contextValue}>
      <TreeView {...mockProps} />
    </FilterContext.Provider>,
  );
};

describe('TreeView', () => {
  beforeEach(() => {
    mockUseLayoutType.mockReturnValue('small-desktop');

    mockUseConfig.mockReturnValue({
      ...getDefaultsFromConfigSchema(configSchema),
      resultsViewerConcepts: [
        {
          conceptUuid: '9a6f10d6-7fc5-4fb7-9428-24ef7b8d01f7',
          defaultOpen: true,
        },
        {
          conceptUuid: '856AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
          defaultOpen: true,
        },
        {
          conceptUuid: '1015AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
          defaultOpen: false,
        },
      ],
      orders: {
        labOrderTypeUuid: '52a447d3-a64a-11e3-9aeb-50e549534c5e',
        labOrderableConcepts: ['1748a953-d12e-4be1-914c-f6b096c6cdef'],
      },
      additionalTestOrderTypes: [],
      labTestsWithOrderReasons: [],
    });
  });

  it('renders an empty state view when there is no data', () => {
    mockUseGetManyObstreeData.mockReturnValue({
      roots: [],
      isLoading: false,
      error: null,
    });

    render(<TreeView {...mockProps} />);

    expect(screen.getByRole('heading', { name: /test results/i })).toBeInTheDocument();
    expect(screen.getByText(/there are no test results data to display for this patient/i)).toBeInTheDocument();
  });

  it('renders an error state when there is an error', () => {
    const mockError = new Error('Test error');
    mockUseGetManyObstreeData.mockReturnValue({
      roots: [],
      isLoading: false,
      error: mockError,
    });

    render(<TreeView {...mockProps} />);

    expect(screen.getByRole('heading', { name: /data load error/i })).toBeInTheDocument();
    expect(
      screen.getByText(
        /sorry, there was a problem displaying this information. you can try to reload this page, or contact the site administrator and quote the error code above./i,
      ),
    ).toBeInTheDocument();
  });

  it('renders the tree view when test data is successfully fetched', async () => {
    mockUseGetManyObstreeData.mockReturnValue({
      roots: mockResults,
      isLoading: false,
      error: null,
    });

    renderTreeViewWithMockContext();

    expect(screen.getByRole('table')).toBeInTheDocument();
    expect(screen.getAllByText('Complete blood count').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Haemoglobin').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Hematocrit').length).toBeGreaterThan(0);
  });
});
