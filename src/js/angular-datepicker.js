/*global angular*/

(function withAngular(angular) {

  'use strict';

  angular.module('720kb.datepicker', [])
  .directive('datepicker',['$window', '$compile', '$locale', '$filter', function manageDirective($window, $compile, $locale, $filter) {

    var A_DAY_IN_MILLISECONDS = 86400000;
    return {
      'restrict': 'E',
      'scope': {
        'dateSet': '@'
      },
      'link': function linkingFunction($scope, element, attr) {
        //get child input
        var thisInput = angular.element(element[0].children[0])
          , theCalendar
          , defaultPrevButton = '<b class="datepicker-default-button">&lang;</b>'
          , defaultNextButton = '<b class="datepicker-default-button">&rang;</b>'
          , prevButton = attr.buttonPrev || defaultPrevButton
          , nextButton = attr.buttonNext || defaultNextButton
          , dateFormat = attr.dateFormat || 'mediumDate'
          , dateMinLimit = attr.dateMinLimit || undefined
          , dateMaxLimit = attr.dateMaxLimit || undefined
          , date = new Date()
          , isMouseOn = false
          , isMouseOnInput = false
          , datetime = $locale.DATETIME_FORMATS
          , pageDatepickers
          , htmlTemplate = '<div class="datepicker-calendar" ng-blur="hideCalendar()">' +
          //motnh+year header
          '<div class="datepicker-calendar-header">' +
          '<div class="datepicker-calendar-header-left">' +
          '<a href="javascript:void(0)" ng-click="prevMonth()">' + prevButton + '</a>' +
          '</div>' +
          '<div class="datepicker-calendar-header-middle datepicker-calendar-month">' +
          '{{month}} <a href="javascript:void(0)" ng-click="showYearsPagination = !showYearsPagination"><span>{{year}} <i ng-if="!showYearsPagination">&dtrif;</i> <i ng-if="showYearsPagination">&urtri;</i> </span> </a>' +
          '</div>' +
          '<div class="datepicker-calendar-header-right">' +
          '<a href="javascript:void(0)" ng-click="nextMonth()">' + nextButton + '</a>' +
          '</div>' +
          '</div>' +
          //years pagination header
          '<div class="datepicker-calendar-header" ng-show="showYearsPagination">' +
          '<div class="datepicker-calendar-years-pagination">' +
          '<a ng-class="{\'datepicker-active\': y === year, \'datepicker-disabled\': !isSelectableMaxYear(y) || !isSelectableMinYear(y)}" href="javascript:void(0)" ng-click="setNewYear(y)" ng-repeat="y in paginationYears">{{y}}</a>' +
          '</div>' +
          '<div class="datepicker-calendar-years-pagination-pages">' +
          '<a href="javascript:void(0)" ng-click="paginateYears(paginationYears[0])">' + prevButton + '</a>' +
          '<a href="javascript:void(0)" ng-click="paginateYears(paginationYears[paginationYears.length -1 ])">' + nextButton + '</a>' +
          '</div>' +
          '</div>' +
          //days column
          '<div class="datepicker-calendar-days-header">' +
          '<div ng-repeat="d in daysInString"> {{d}} </div> ' +
          '</div>' +
          //days
          '<div class="datepicker-calendar-body">' +
          '<a href="javascript:void(0)" ng-repeat="px in prevMonthDays" class="datepicker-calendar-day datepicker-disabled">{{px}}</a>' +
          '<a href="javascript:void(0)" ng-repeat="item in days" ng-click="setDatepickerDay(item)" ng-class="{\'datepicker-active\': day === item, \'datepicker-disabled\': !isSelectableMinDate(year + \'/\' + monthNumber + \'/\' + item ) || !isSelectableMaxDate(year + \'/\' + monthNumber + \'/\' + item)}" class="datepicker-calendar-day">{{item}}</a>' +
          '<a href="javascript:void(0)" ng-repeat="nx in nextMonthDays" class="datepicker-calendar-day datepicker-disabled">{{nx}}</a>' +
          '</div>' +
          '</div>' +
          '</div>';

        $scope.$watch('dateSet', function(value) {
          if (value) {
            date = new Date(value);
            $scope.month = $filter('date')(date, 'MMMM');//December-November like
            $scope.monthNumber = Number($filter('date')(date, 'MM')); // 01-12 like
            $scope.day = Number($filter('date')(date, 'dd')); //01-31 like
            $scope.year = Number($filter('date')(date,'yyyy'));//2014 like
          }
        });

        $scope.month = $filter('date')(date, 'MMMM');//December-November like
        $scope.monthNumber = Number($filter('date')(date, 'MM')); // 01-12 like
        $scope.day = Number($filter('date')(date, 'dd')); //01-31 like
        $scope.year = Number($filter('date')(date,'yyyy'));//2014 like
        $scope.months = datetime.MONTH;
        $scope.daysInString = ['0', '1', '2', '3', '4', '5', '6'].map(function mappingFunc(el) {

          return $filter('date')(new Date(new Date('06/08/2014').valueOf() + A_DAY_IN_MILLISECONDS * el), 'EEE');
        });

        //create the calendar holder
        thisInput.after($compile(angular.element(htmlTemplate))($scope));

        //get the calendar as element
        theCalendar = element[0].children[1];
        //some tricky dirty events to fire if click is outside of the calendar and show/hide calendar when needed
        thisInput.bind('focus click', function onFocusAndClick() {

          isMouseOnInput = true;

          $scope.showCalendar();
        });

        thisInput.bind('focusout', function onBlurAndFocusOut() {

          isMouseOnInput = false;
        });

        angular.element(theCalendar).bind('mouseenter', function onMouseEnter() {

          isMouseOn = true;
        });

        angular.element(theCalendar).bind('mouseleave', function onMouseLeave() {

          isMouseOn = false;
        });

        angular.element(theCalendar).bind('focusin', function onCalendarFocus() {

          isMouseOn = true;
        });

        angular.element($window).bind('click focus', function onClickOnWindow() {

          if (!isMouseOn &&
            !isMouseOnInput) {

            $scope.hideCalendar();
          }
        });

        $scope.nextMonth = function manageNextMonth() {

          if ($scope.monthNumber === 12) {

            $scope.monthNumber = 1;
            //its happy new year
            $scope.nextYear();
          } else {

            $scope.monthNumber += 1;
          }
          //set next month
          $scope.month = $filter('date')(new Date($scope.year + '/' + $scope.monthNumber + '/' + $scope.day), 'MMMM');
          //reinit days
          $scope.setDaysInMonth($scope.monthNumber, $scope.year);
          $scope.setInputValue();
        };

        $scope.setNewYear = function setNewYear (year) {

          $scope.year = Number(year);
          $scope.setDaysInMonth($scope.monthNumber, $scope.year);
          $scope.paginateYears(year);
          $scope.setInputValue();
        };

        $scope.prevMonth = function managePrevMonth() {

          if ($scope.monthNumber === 1) {

            $scope.monthNumber = 12;
            //its happy new year
            $scope.prevYear();
          } else {

            $scope.monthNumber -= 1;
          }
          //set next month
          $scope.month = $filter('date')(new Date($scope.year + '/' + $scope.monthNumber + '/' + $scope.day), 'MMMM');
          //reinit days
          $scope.setDaysInMonth($scope.monthNumber, $scope.year);
          $scope.setInputValue();
        };

        $scope.nextYear = function manageNextYear() {

          $scope.year = Number($scope.year) + 1;
          $scope.setInputValue();
        };

        $scope.prevYear = function managePrevYear() {

          $scope.year = Number($scope.year) - 1;
          $scope.setInputValue();
        };

        $scope.setInputValue = function manageInputValue() {

          if ($scope.isSelectableMinDate($scope.year + '/' + $scope.monthNumber + '/' + $scope.day)
              && $scope.isSelectableMaxDate($scope.year + '/' + $scope.monthNumber + '/' + $scope.day)) {

            thisInput.val($filter('date')(new Date($scope.year + '/' + $scope.monthNumber + '/' + $scope.day), dateFormat))
            .triggerHandler('input').triggerHandler('change');//just to be sure;
          } else {

            return false;
          }
        };

        $scope.showCalendar = function manageShowCalendar() {
          //lets hide all the latest instances of datepicker
          pageDatepickers = $window.document.getElementsByClassName('datepicker-calendar');

          angular.forEach(pageDatepickers, function (value, key) {

            pageDatepickers[key].classList.remove('datepicker-open');
          });

          theCalendar.classList.add('datepicker-open');
        };

        $scope.hideCalendar = function manageHideCalendar() {

          theCalendar.classList.remove('datepicker-open');
        };

        $scope.setDaysInMonth = function setDaysInMonth(month, year) {

          var i
            , limitDate = new Date(year, month, 0).getDate()
            , firstDayMonthNumber = new Date(year + '/' + month + '/' + 1).getDay()
            , lastDayMonthNumber = new Date(year + '/' + month + '/' + limitDate).getDay()
            , prevMonthDays = []
            , nextMonthDays = []
            , howManyNextDays
            , howManyPreviousDays
            , monthAlias;

          $scope.days = [];

          for (i = 1; i <= limitDate; i += 1) {

            $scope.days.push(i);
          }
          //get previous month days is first day in month is not Sunday
          if (firstDayMonthNumber !== 0) {

            howManyPreviousDays = firstDayMonthNumber;

            //get previous month
            if (Number(month) === 1) {

              monthAlias = 12;
            } else {

              monthAlias = month - 1;
            }
            //return previous month days
            for (i = 1; i <= new Date(year, monthAlias, 0).getDate(); i += 1) {

              prevMonthDays.push(i);
            }
            //attach previous month days
            $scope.prevMonthDays = prevMonthDays.slice(-howManyPreviousDays);
          } else {
            //no need for it
            $scope.prevMonthDays = [];
          }

          //get next month days is first day in month is not Sunday
          if (lastDayMonthNumber < 6) {

            howManyNextDays = 6 - lastDayMonthNumber;
            //get previous month

            //return next month days
            for (i = 1; i <= howManyNextDays; i += 1) {

              nextMonthDays.push(i);
            }
            //attach previous month days
            $scope.nextMonthDays = nextMonthDays;
          } else {
            //no need for it
            $scope.nextMonthDays = [];
          }
        };

        $scope.setDatepickerDay = function setDatepickeDay(day) {

          $scope.day = Number(day);
          $scope.setInputValue();
          $scope.hideCalendar();
        };

        $scope.paginateYears = function paginateYears (startingYear) {

          $scope.paginationYears = [];
          var i;
          for (i = 10/* Years */; i > 0; i -= 1) {

            $scope.paginationYears.push(startingYear - i);
          }

          for (i = 0; i < 10/* Years */; i += 1) {

            $scope.paginationYears.push(startingYear + i);
          }
        };

        $scope.isSelectableMinDate = function isSelectableMinDate (date) {
          //if current date
          if (!!dateMinLimit &&
             !!new Date(dateMinLimit) &&
             (new Date(date).getTime() < new Date(dateMinLimit).getTime())) {

            return false;
          }

          return true;
        };

        $scope.isSelectableMaxDate = function isSelectableMaxDate (date) {

          //if current date
          if (!!dateMaxLimit &&
             !!new Date(dateMaxLimit) &&
             (new Date(date).getTime() > new Date(dateMaxLimit).getTime())) {

            return false;
          }

          return true;
        };

        $scope.isSelectableMaxYear = function isSelectableMaxYear (year) {

          if (!!dateMaxLimit
            && (year > new Date(dateMaxLimit).getFullYear())) {

            return false;
          }

          return true;
        };

        $scope.isSelectableMinYear = function isSelectableMinYear (year) {

          if (!!dateMinLimit
            && (year < new Date(dateMinLimit).getFullYear())) {

            return false;
          }

          return true;
        };

        $scope.paginateYears($scope.year);
        $scope.setDaysInMonth($scope.monthNumber, $scope.year);
      }
    };
  }]);
}(angular));
