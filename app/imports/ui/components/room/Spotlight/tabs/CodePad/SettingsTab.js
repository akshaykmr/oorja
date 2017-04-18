import React, { Component } from 'react';
import _ from 'lodash';
import { Meteor } from 'meteor/meteor';
import syntaxList from './syntaxList';
import colorSchemes from './colorSchemes';

class SettingsTab extends Component {
  constructor(props) {
    super(props);

    this.state = {
      fontSize: 15,
      syntaxList,
      colorSchemes,
      activeSyntax: props.initialSettings.syntax, // default | javascript
      activeColorScheme: props.initialSettings.colorScheme, // default | dark
    };

    this.renderLanguageOptions = this.renderLanguageOptions.bind(this);
    this.handleSyntaxChange = this.handleSyntaxChange.bind(this);
    this.renderColorSchemeOptions = this.renderColorSchemeOptions.bind(this);
    this.handleColorSchemeChange = this.handleColorSchemeChange.bind(this);
  }

  renderLanguageOptions(syntax, index) {
    return (
      <option
        key={index}
        value={syntax.mode}>
        {syntax.name}
      </option>
    );
  }

  handleSyntaxChange(event) {
    const syntax = _.find(syntaxList, { mode: event.target.value });
    if (!syntax) throw new Meteor.Error('syntax not found in syntaxList');
    this.props.editor.getSession().setMode(`ace/mode/${syntax.mode}`);
    this.setState({
      ...this.state,
      activeSyntax: syntax,
    });
  }

  renderColorSchemeOptions(colorScheme, index) {
    return (
      <option
        key={index}
        value={colorScheme.theme}>
        {colorScheme.name}
      </option>
    );
  }

  handleColorSchemeChange(event) {
    const colorScheme = _.find(colorSchemes, { theme: event.target.value });
    if (!colorScheme) throw new Meteor.Error('colorScheme not found in colorSchemes');
    this.props.editor.setTheme(`ace/theme/${colorScheme.theme}`);
    this.setState({
      ...this.state,
      activeColorScheme: colorScheme,
    });
  }

  render() {
    return (
      <div className={this.props.classNames} style={this.props.style}>
      <label className="pt-label pt-dark">
        Language
        <div className="pt-select">
          <select className=".pt-minimal"
            value={this.state.activeSyntax.mode}
            onChange={this.handleSyntaxChange}>
            {syntaxList.map(this.renderLanguageOptions)}
          </select>
        </div>
      </label>
      <br/>
      <label className="pt-label pt-dark">
        Theme
        <div className="pt-select">
          <select className=".pt-minimal"
            value={this.state.activeColorScheme.theme}
            onChange={this.handleColorSchemeChange}>
            {colorSchemes.map(this.renderColorSchemeOptions)}
          </select>
        </div>
      </label>
      </div>
    );
  }
}

SettingsTab.propTypes = {
  classNames: React.PropTypes.string,
  style: React.PropTypes.object,
  editor: React.PropTypes.object,
  initialSettings: React.PropTypes.object,
};

export default SettingsTab;
