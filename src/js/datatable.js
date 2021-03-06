/*
*
*  Datatables
*
*/

angular.module('ui.datatable', [])
    .controller('tableController', ['$scope', function($scope){
        $scope.columns = [];

        $scope.sorter = [];

        $scope.current_page = 1;

        $scope.no_of_pages = 0;

        $scope.showEditColumn = false;

        getSortName = function(column, order) {
            if (order == "asc") return column;
            if (order == "desc") return "-" + column;
            return column;
        };

        $scope.setCurrentPage = function(n) {
            if (n > 0 && n <= $scope.no_of_pages) {
                $scope.current_page = n;    
            }
        };

        $scope.nextPage = function() {
            if ($scope.current_page < $scope.no_of_pages) {
                $scope.current_page++;
            }
        };

        $scope.prevPage = function() {
            if ($scope.current_page > 1) {
                $scope.current_page--;
            }
        };

        $scope.sortStatus = function(column) {
            if ($scope.options.hasOwnProperty('sortable') && $scope.options.sortable.columns.indexOf(column) != -1) {
                var sort = 'sortable';
                angular.forEach($scope.sorter, function(value, key){
                    if(value == getSortName(column, "asc")) {
                        sort = "asc";
                    }
                    if (value == getSortName(column, "desc")) {
                        sort = "desc";
                    }
                });
                return sort;
            }
            return null;
        };

        $scope.sort = function(column) {
            if ($scope.options.sortable.columns.indexOf(column) != -1) {
                var found = null;
                var prefix = "";
                var status = $scope.sortStatus(column);
                status = status == "sortable" ? null : status;
                
                if (status !== null) {
                    index = $scope.sorter.indexOf(getSortName(column, status));
                    $scope.sorter.splice(index, 1);
                }

                if (status) {
                    status = (status == "asc" ? "desc" : "asc");
                }

                $scope.sorter.unshift(getSortName(column, status));
            }
        };

        $scope.getColumns = function() {
            $scope.columns = [];
            if($scope.options.hasOwnProperty('columns'))
            {
                $scope.columns = angular.copy($scope.options.columns);
            }
            angular.forEach($scope.tableData, function(row, key){
                angular.forEach(row, function(column_data, column_key) {
                    if($scope.columns.indexOf(column_key) == -1)
                    {
                        if(!$scope.options.hasOwnProperty('columns') || ($scope.options.hasOwnProperty('columns') && $scope.options.columns.indexOf(column_key) != -1))
                        {
                            $scope.columns.push(column_key);
                        }
                    }
                });
            });
        };

        $scope.setupSorter = function() {
            if($scope.options.hasOwnProperty('sortable') && $scope.options.sortable.hasOwnProperty('default'))
            {
                $scope.sorter = angular.copy($scope.options.sortable.default);
            }
        };

        $scope.edit = function(data) {
            if ($scope.options.hasOwnProperty('edit')  && $scope.options.edit.enable) {
                $scope.options.edit.onEdit(data);    
            }
        };

        $scope.delete = function(data) {
            if ($scope.options.hasOwnProperty('delete') && $scope.options.delete.enable) {
                $scope.options.delete.onDelete(data);
            }
        };

        $scope.enableSearch = function() {
            if ($scope.options.hasOwnProperty('search') && $scope.options.search.enable) {
                return true;
            }
            return false;
        };

        $scope.showPagination = function() {
            if($scope.no_of_pages > 1)
            {
                return true;
            }
            return false;
        };

        $scope.mouseOver = function(row) {
            if($scope.options.edit.enable || $scope.options.delete.enable)
            {
                row.edit = true;
                $scope.showEditColumn = true;
            }
        };

        $scope.mouseLeave = function(row) {
            row.edit = false;
            $scope.showEditColumn = false;
        };

        $scope.$watch("search", function(oldvalue, newvalue) {
            if (oldvalue !== newvalue) {
                $scope.current_page = 1;
            }
        });

    }])

    .filter('displayName', function() {
        return function(name, $scope) {
            if($scope.options.hasOwnProperty('colDefs'))
            {
                if ($scope.options.colDefs.hasOwnProperty(name) && $scope.options.colDefs[name].displayName) {
                    return $scope.options.colDefs[name].displayName;
                }
            }
            return name;
        };
    })

    .filter('applyColumnFilter', function($filter) {
        return function(input, column, $scope) {
            if ($scope.options.hasOwnProperty('colDefs') && $scope.options.colDefs[column]) {
                var colDef = $scope.options.colDefs[column];
                var filter = colDef.filter;
                if(filter)
                {
                    var args = [input];
                    args = args.concat(filter.args);
                    return $filter(filter.name).apply(null, args);
                }
            }
            return input;
        };
    })
    
    .filter('applyRowFilter', function($filter) {
        return function(input, $scope) {
            if ($scope.options.hasOwnProperty('filter')) {
                var filter = $scope.options.filter;
                if(filter)
                {
                    var args = [input];
                    args = args.concat(filter.args);
                    return $filter(filter.name).apply(this, args);
                }
            }
            return input;
        };
    })

    .filter('search', function($filter) {
        return function(input, search, $scope) {
            if ($scope.options && $scope.options.hasOwnProperty('search') && $scope.options.search.enable && search) {
                columns = $scope.options.search.columns;
                if(columns)
                {
                    input = $filter('filter')(input, function(row) {
                        var containsValue = false;
                        for(var prop in row) {
                            if (row[prop] && (columns.indexOf(prop) != -1)) {
                                var value = String(row[prop]).toLowerCase();
                                if (value.indexOf(search) > -1) {
                                    containsValue = true;
                                }
                            }
                        }
                        return containsValue;
                    });                    
                    return input;
                }
                else 
                {
                    return $filter('filter')(input, search);
                }
            }
            return input;
        };
    })

    .filter('range', function() {
        return function(input, number) {
            number = parseInt(number);
            for (var i = 0; i < number; i++) {
                input.push(i+1);
            }
            return input;
        };
    })

    .filter('paginator', function($filter) {
        return function(input, $scope) {
            var limit = $scope.options.hasOwnProperty('limit') && $scope.options.limit != null ? $scope.options.limit : 50 ;
            $scope.no_of_pages = Math.ceil(input.length / limit);
            $scope.no_of_elements_per_page = limit;
            var start_index = ($scope.current_page - 1 ) * $scope.no_of_elements_per_page;
            input = $filter('limitTo')(input.slice(start_index), $scope.no_of_elements_per_page);
            return input;
        };
    })

    .directive('mgTable', function() {
        return {
            scope: {
                tableData: '=mgData',
                options: '=mgDataOptions'
            }, 
            controller: 'tableController',
            restrict: 'E',
            templateUrl: 'datatable.html',
            replace: true,
            link: function($scope, iElm, iAttrs, controller) {
                $scope.getColumns();
                $scope.setupSorter();
                iAttrs.$observe('mgDataOptions', function(val) {
                  $scope.getColumns();
                    $scope.setupSorter();
                });
            }
        };
    });