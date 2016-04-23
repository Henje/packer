"use strict";

angular.module('packer', ['ngMaterial'])
  .controller('packerCtrl', ['$scope', '$http', '$timeout', 'BiasedRandomList', function ($scope, $http, $timeout, RandomList) {

    var rand = new MersenneTwister();
    var goldDrops = {comm: 2.0637, rare: 5.5395, epic: 4.5173, lgnd: 7.3107};
    var disenchant = {
      norm: {
        comm: 5,
        rare: 20,
        epic: 100,
        lgnd: 400,
      },
      gold: {
        comm: 50,
        rare: 100,
        epic: 400,
        lgnd: 1600,
      }
    };
    var cs = {name: '', rarity: '', set: '', playerClass: ''};
    var cards = {};
    $scope.set = 'WOG';
    $scope.noPacks = 63;
    $scope.open = function () {
      if ($scope.working) return;
      packGen();
      run($scope, $scope.noPacks);
      ga('send', {
        hitType: 'event',
        eventCategory: 'packs',
        eventAction: 'reopen',
        eventValue: $scope.noPacks,
      });
    };

    $http.get('json/cards.json')
      .then(function (data) {
        cards = {};
        cards.data = data.data;
        filterCards();
        //packGen();
        //var s = {};
        //run(s, 25000);
        //console.log(($scope.stats.norm.comm / $scope.stats.cards).toFixed(8)*100);
        //console.log(($scope.stats.norm.rare / $scope.stats.cards).toFixed(8)*100);
        //console.log(($scope.stats.norm.epic / $scope.stats.cards).toFixed(8)*100);
        //console.log(($scope.stats.norm.lgnd / $scope.stats.cards).toFixed(8)*100);
        packGen();
        run($scope, $scope.noPacks);
        $scope.done = true;
        if (window.performance) {
          var timeSincePageLoad = Math.round(performance.now());
          ga('send', 'timing', 'JSON', 'load', timeSincePageLoad);
        }
        ga('send', {
          hitType: 'event',
          eventCategory: 'packs',
          eventAction: 'initial'
        });
      });

    function run(scope, n) {
      n = n || 50;
      scope.packs = [[
        {"rarity": "comm", "gold": false, "detail": {"name": "Beckoner of Evil", "rarity": "COMMON", "set": "WOG"}},
        {"rarity": "comm", "gold": false, "detail": {"name": "Beckoner of Evil", "rarity": "COMMON", "set": "WOG"}},
        {"rarity": "lgnd", "gold": false, "detail": {"name": "C'thun", "rarity": "LEGENDARY", "set": "WOG"}},
      ]];
      var push = function () {
        scope.packs.push(pack());
      };
      scope.working = true;
      var tos = [];
      for (var i = 0; i < n; i++) {
        tos.push($timeout(push, 0, true));
      }
      Promise.all(tos).then(function () {
        if (scope.$apply) scope.$apply('working = false');
      });
    }

    var card;
    var pack;

    function packGen() {
      var norm = {
        comm: 0,
        rare: 0,
        epic: 0,
        lgnd: 0,
      };
      var gold = {
        comm: 0,
        rare: 0,
        epic: 0,
        lgnd: 0,
      };
      $scope.stats = {
        cards: 0,
        norm: {
          comm: 0,
          rare: 0,
          epic: 0,
          lgnd: 0,
        },
        gold: {
          comm: 0,
          rare: 0,
          epic: 0,
          lgnd: 0,
        },
        dust: {
          norm: {
            all: 0,
            extra: 0,
          },
          gold: {
            all: 0,
            extra: 0,
          }
        },
        collection: {
          DRUID: {},
          HUNTER: {},
          MAGE: {},
          PALADIN: {},
          PRIEST: {},
          ROGUE: {},
          SHAMAN: {},
          WARLOCK: {},
          WARRIOR: {},
          NEUTRAL: {
            'Beckoner of Evil': {
              norm: 2,
              gold: 0,
              rarity: 'comm',
              "detail": {"name": "Beckoner of Evil", "rarity": "COMMON", "set": "WOG"}
            },
            'C\'thun': {
              norm: 1,
              gold: 0,
              rarity: 'lgnd',
              "detail": {"name": "C'thun", "rarity": "LEGENDARY", "set": "WOG"}
            }
          },
        },
      };
      var first = true;
      cards.all.forEach(function (v) {
        var r = (function () {
          if (v.rarity === 'LEGENDARY') {
            return 'lgnd';
          } else {
            return v.rarity.toLowerCase().slice(0, 4);
          }
        })();
        $scope.stats.collection[v.playerClass || 'NEUTRAL'][v.name] = {norm: 0, gold: 0, rarity: r, detail: v};
      });

      pack = function () {
        var rarity;
        for (rarity in norm) {
          if (norm.hasOwnProperty(rarity)) {
            norm[rarity]++;
          }
        }
        for (rarity in gold) {
          if (gold.hasOwnProperty(rarity)) {
            gold[rarity]++;
          }
        }

        return [
          card({comm: 99.99, rare: 0.01, epic: 0, lgnd: 0}),
          card({comm: 99.8, rare: 0.19, epic: 0.01, lgnd: 0}),
          card({comm: 96, rare: 3.95, epic: 0.05, lgnd: 0}),
          card({comm: 70.9, rare: 28, epic: 1.9, lgnd: 0.02}),
          card({comm: 0, rare: 80.6, epic: 15.2, lgnd: 4.2}),
        ];
      };

      $scope.pack = function () {
        if ($scope.working) return;
        $scope.packs.push(pack());
      };

      card = function card(chances) {
        var rarity = (function () {
          if (chances.comm > 0 && gold.comm >= 25) {
            return ['comm', true];
          } else if (gold.rare >= 30) {
            return ['rare', true];
          } else if (gold.epic >= 137) {
            return ['epic', true];
          } else if (gold.lgnd >= 310) {
            return ['lgnd', true];
          } else if (norm.epic >= 10) {
            return ['epic', false];
          } else if (norm.lgnd >= 40) {
            return ['lgnd', false];
          } else {
            var list = new RandomList([], function (i) {
              return i.weight;
            });
            for (var r in chances) {
              if (chances.hasOwnProperty(r)) {
                list.push({rarity: r, weight: chances[r]});
              }
            }
            var chosen = list.peek().rarity;
            var isGolden = rand.realx() * 100 < goldDrops[chosen];
            return [chosen, isGolden];
          }
        })();
        var c = {
          rarity: rarity[0],
          gold: rarity[1],
          detail: cards.rand[rarity[0]].peek(),
        };
        var group = c.gold ? gold : norm;
        group[c.rarity] = 0;
        $scope.stats.cards++;
        $scope.stats.norm[c.rarity]++;
        if (c.gold) $scope.stats.gold[c.rarity]++;
        var isGold = c.gold ? 'gold' : 'norm';
        var cnt = ++$scope.stats.collection[c.detail.playerClass || 'NEUTRAL'][c.detail.name][isGold];
        $scope.stats.dust[isGold].all += disenchant[isGold][c.rarity];
        var max = c.rarity === 'lgnd' ? 1 : 2;
        if (cnt > max) {
          $scope.stats.dust[isGold].extra += disenchant[isGold][c.rarity];
          c.extra = true;
        }

        return c;
      };
    }

    function filterCards() {
      cards.all = cards.data.filter(function (v) {
        return v.set === $scope.set;
      });
      cards.list = {};
      cards.rand = {};
      cards.list.comm = cards.all.filter(function (v) {
        return v.rarity === "COMMON";
      });
      cards.rand.comm = new RandomList(cards.list.comm);
      cards.list.rare = cards.all.filter(function (v) {
        return v.rarity === "RARE";
      });
      cards.rand.rare = new RandomList(cards.list.rare);
      cards.list.epic = cards.all.filter(function (v) {
        return v.rarity === "EPIC";
      });
      cards.rand.epic = new RandomList(cards.list.epic);
      cards.list.lgnd = cards.all.filter(function (v) {
        return v.rarity === "LEGENDARY";
      });
      cards.rand.lgnd = new RandomList(cards.list.lgnd);
    }

  }])
  .directive('card', function () {

    return {
      template: "<div ng-if='type' ng-class='card.rarity'>" +
      "  {{card.detail.name}} x{{card.norm}} <strong>x{{card.gold}}</strong>" +
      "</div>" +
      "<div ng-if='!type' class='card' ng-class='[card.rarity, {gold: card.gold, extra: card.extra}]'>" +
      " {{card.detail.name}}" +
      "</div>",
      link: function (scope, element, attrs) {
        scope.type = angular.isNumber(scope.card.norm) && angular.isNumber(scope.card.gold);
      }
    };
  })
  .directive('ngEnter', function () {
    return function (scope, element, attrs) {
      element.bind("keydown keypress", function (event) {
        if (event.which === 13) {
          scope.$apply(function () {
            scope.$eval(attrs.ngEnter);
          });

          event.preventDefault();
        }
      });
    };
  });