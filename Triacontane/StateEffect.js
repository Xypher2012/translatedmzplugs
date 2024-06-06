/*=============================================================================
 StateEffect.js
----------------------------------------------------------------------------
 (C)2022 Triacontane
 This software is released under the MIT License.
 http://opensource.org/licenses/mit-license.php
----------------------------------------------------------------------------
 Version
 1.1.0 2022/09/25 Added the ability to exclude state effects from pop-ups and messages.
 1.0.0 2022/04/10 First version
----------------------------------------------------------------------------
 [Blog]   : https://triacontane.blogspot.jp/
 [Twitter]: https://twitter.com/triacontane/
 [GitHub] : https://github.com/triacontane/
=============================================================================*/

/*:
 * @plugindesc State Effect Plugin
 * @target MZ
 * @url https://github.com/triacontane/RPGMakerMV/tree/mz_master/StateEffect.js
 * @base PluginCommonBase
 * @orderAfter PluginCommonBase
 * @author Triacontane
 *
 * @param noDisplay
 * @text Hide State Effect
 * @desc Exclude state effects applied by this plugin from pop-ups and messages.
 * @default false
 * @type boolean
 *
 * @help StateEffect.js
 *
 * This plugin applies the usage effect of the specified skill to the target when a state is applied.
 * This allows you to create an effect that occurs only at the moment the state is activated, rather than a continuous effect.
 *
 * When a state becomes effective, the damage and effect of skill [3] will be applied.
 * <StateEffect:3>
 *
 * Skill contents other than usage effects (damage, animation, etc.) are not referenced.
 *　
 * This plugin requires the base plugin 'PluginCommonBase.js'.
 * 'PluginCommonBase.js' is located in the following folder under the RPG Maker MZ installation folder.
 * dlc/BasicResources/plugins/official
 *
 * Terms of Use:
 *  Modification and redistribution are allowed without permission of the author.
 *  There are no restrictions on usage form (commercial use, 18+ use, etc.).
 *  This plugin is now yours.
 */

(()=> {
    'use strict';
    const script = document.currentScript;
    const param = PluginManagerEx.createParameter(script);

    const _Game_BattlerBase_addNewState = Game_BattlerBase.prototype.addNewState;
    Game_BattlerBase.prototype.addNewState = function(stateId) {
        _Game_BattlerBase_addNewState.apply(this, arguments);
        const skillId = PluginManagerEx.findMetaValue($dataStates[stateId] || {}, ['ステート効果', 'StateEffect']);
        if (skillId) {
            this.applyStateEffect(skillId);
        }
    };

    Game_BattlerBase.prototype.applyStateEffect = function(skillId) {
        if (!$dataSkills[skillId]) {
            return;
        }
        const action = new Game_Action(this);
        action.setSkill(skillId);
        action.applyStateEffect(this);
    };

    Game_Battler.prototype.setDummyResult = function() {
        this._realResult = this._result;
        this._result = new Game_ActionResult();
    };

    Game_Battler.prototype.restoreResult = function() {
        if (this._realResult) {
            this._result = this._realResult;
            this._realResult = null;
        }
    };

    Game_Action.prototype.applyStateEffect = function(target) {
        if (param.noDisplay) {
            target.setDummyResult();
        }
        this.item().effects.forEach(function(effect) {
            this.applyItemEffect(target, effect);
        }, this);
        this.applyGlobal();
        target.restoreResult();
    };
})();
