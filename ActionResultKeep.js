/*=============================================================================
 ActionResultKeep.js
----------------------------------------------------------------------------
 (C)2022 Triacontane
 This software is released under the MIT License.
 http://opensource.org/licenses/mit-license.php
----------------------------------------------------------------------------
 Version
 1.0.0 2022/08/30 First version
----------------------------------------------------------------------------
 [Blog]   : https://triacontane.blogspot.jp/
 [Twitter]: https://twitter.com/triacontane/
 [GitHub] : https://github.com/triacontane/
=============================================================================*/

/*:
 * @plugindesc Action Result Retention Plugin
 * @target MZ
 * @url https://github.com/triacontane/RPGMakerMV/tree/mz_master/ActionResultKeep.js
 * @base PluginCommonBase
 * @orderAfter PluginCommonBase
 * @author Triacontane
 *
 * @param flagResultList
 * @text Flag Result List
 * @desc Stores flag items in the action result in the specified switch.
 * @default []
 * @type struct<FlagResult>[]
 *
 * @param variableResultList
 * @text Number Result List
 * @desc Stores numerical and array items in the action result in the specified variable.
 * @default []
 * @type struct<VariableResult>[]
 *
 * @help ActionResultKeep.js
 *
 * This plugin stores the user and result of the last action in a dedicated variable.
 * This information can be referenced from common events, etc., called from skills.
 * Execute the corresponding script for each.
 *
 * - User
 * $gameTemp.lastSubject()
 * - Target
 * $gameTemp.lastTarget()
 * - Skill
 * $gameTemp.lastSkill()
 * - Action result (success or evasion judgment)
 * The content set in the plugin parameter is stored in switches and variables.
 *
 * This plugin requires the base plugin 'PluginCommonBase.js'.
 * 'PluginCommonBase.js' is located in the following folder under the RPG Maker MZ installation folder.
 * dlc/BasicResources/plugins/official
 *
 * Terms of Use:
 *  Modification and redistribution are allowed without permission of the author.
 *  There are no restrictions on usage (commercial use, use in adult-only works, etc.).
 *  This plugin is now yours.
 */

/*~struct~FlagResult:
 *
 * @param switchId
 * @text Switch ID
 * @desc The switch number where the flag item is stored.
 * @default 1
 * @type switch
 *
 * @param property
 * @text Property
 * @desc The value of the specified property will be stored in the switch.
 * @default missed
 * @type select
 * @option Missed
 * @value missed
 * @option Evaded
 * @value evaded
 * @option Physical Attack
 * @value physical
 * @option Absorbed
 * @value drain
 * @option Critical
 * @value critical
 * @option Action Succeeded
 * @value success
 * @option HP Affected
 * @value hpAffected
 *
 */

/*~struct~VariableResult:
 *
 * @param variableId
 * @text Variable ID
 * @desc The variable number where the numerical item will be stored.
 * @default 1
 * @type variable
 *
 * @param property
 * @text Property
 * @desc The value of the specified property will be stored in the variable.
 * @default hpDamage
 * @type select
 * @option HP Effect Amount
 * @value hpDamage
 * @option MP Effect Amount
 * @value mpDamage
 * @option TP Effect Amount
 * @value tpDamage
 * @option Added State Array
 * @value addedStates
 * @option Removed State Array
 * @value removedStates
 * @option Added Buff Array
 * @value addedBuffs
 * @option Added Debuff Array
 * @value addedDebuffs
 * @option Removed Buff Array
 * @value removedBuffs
 *
 */

(() => {
    'use strict';
    const script = document.currentScript;
    const param = PluginManagerEx.createParameter(script);
    if (!param.flagResultList) {
        param.flagResultList = [];
    }
    if (!param.variableResultList) {
        param.variableResultList = [];
    }

    const _Game_Temp_initialize = Game_Temp.prototype.initialize;
    Game_Temp.prototype.initialize = function() {
        _Game_Temp_initialize.apply(this, arguments);
        this._lastAction = new Game_LastAction();
    };

    Game_Temp.prototype.lastAction = function() {
        return this._lastAction
    };

    Game_Temp.prototype.lastSubject = function() {
        return this._lastAction.findSubject();
    };

    Game_Temp.prototype.lastTarget = function() {
        return this._lastAction.findTarget();
    };

    Game_Temp.prototype.lastSkill = function() {
        return this._lastAction.findItem();
    };

    /**
     * Game_LastAction
     * This class is for holding the result of the last action.
     */
    class Game_LastAction {
        constructor() {
            this._subjectIsActor = null;
            this._targetIsActor = null;
            this._usingIsSkill = null;
        }

        updateSubject(subject) {
            this._subjectIsActor = subject.isActor();
        }

        updateTarget(target) {
            this._targetIsActor = target.isActor();
        }

        updateUsed(item) {
            this._usingIsSkill = DataManager.isSkill(item);
        }

        updateResult(result) {
            param.flagResultList.forEach(item => {
                $gameSwitches.setValue(item.switchId, result[item.property]);
            });
            param.variableResultList.forEach(item => {
                $gameVariables.setValue(item.variableId, result[item.property]);
            });
        }

        findSubject() {
            if (this._subjectIsActor) {
                return $gameActors.actor($gameTemp.lastActionData(2));
            } else {
                return $gameTroop.members()[$gameTemp.lastActionData(3) - 1];
            }
        }

        findTarget() {
            if (this._targetIsActor) {
                return $gameActors.actor($gameTemp.lastActionData(4));
            } else {
                return $gameTroop.members()[$gameTemp.lastActionData(5) - 1];
            }
        }

        findItem() {
            if (this._usingIsSkill) {
                return $dataSkills[$gameTemp.lastActionData(0)];
            } else {
                return $dataItems[$gameTemp.lastActionData(1)];
            }
        }
    }

    const _Game_Action_apply = Game_Action.prototype.apply;
    Game_Action.prototype.apply = function(target) {
        _Game_Action_apply.apply(this, arguments);
        $gameTemp.lastAction().updateResult(target.result());
    };

    const _Game_Action_updateLastSubject = Game_Action.prototype.updateLastSubject;
    Game_Action.prototype.updateLastSubject = function() {
        _Game_Action_updateLastSubject.apply(this, arguments);
        $gameTemp.lastAction().updateSubject(this.subject());
    };

    const _Game_Action_updateLastUsed = Game_Action.prototype.updateLastUsed;
    Game_Action.prototype.updateLastUsed = function() {
        _Game_Action_updateLastUsed.apply(this, arguments);
        $gameTemp.lastAction().updateUsed(this.item());
    };

    const _Game_Action_updateLastTarget = Game_Action.prototype.updateLastTarget;
    Game_Action.prototype.updateLastTarget = function(target) {
        _Game_Action_updateLastTarget.apply(this, arguments);
        $gameTemp.lastAction().updateTarget(target);
    };
})();